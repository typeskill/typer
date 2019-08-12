import Delta from 'quill-delta'
import { getTextAttributesAtCursor, getTextAttributes, Attributes } from './attributes'
import { Selection } from './Selection'
import { GenericOp } from './operations'
import mergeRight from 'ramda/es/mergeRight'
import pickBy from 'ramda/es/pickBy'
import head from 'ramda/es/head'
import { GenericRichContent, extractTextFromDelta } from './generic'
import { DeltaDiffComputer } from './DeltaDiffComputer'
import { DeltaChangeContext } from './DeltaChangeContext'
import { DocumentLine, LineWalker } from './LineWalker'
import { DocumentDeltaAtomicUpdate } from './DocumentDeltaAtomicUpdate'

export class DocumentDelta implements GenericRichContent {
  public get ops() {
    return this.delta.ops
  }

  private delta: Delta
  private text: string | null = null

  public constructor(arg?: GenericOp[] | DocumentDelta | Delta) {
    this.delta = arg instanceof DocumentDelta ? new Delta(arg.delta) : new Delta(arg)
  }

  private getText(): string {
    if (this.text !== null) {
      return this.text
    }
    this.text = extractTextFromDelta(this.delta)
    return this.text
  }

  /**
   * @returns a Selection which encompasses all characters in lines traversed by incoming `selection`
   *
   * @param selection - The selection touching lines.
   */
  private getSelectionEncompassingLines(selection: Selection): Selection {
    let accumulatedLength = 0
    let newSelectionStart = selection.start
    let newSelectionEnd = selection.end
    let isUpperBoundFrozen = false
    this.delta.eachLine(l => {
      if (selection.start > accumulatedLength - 1) {
        newSelectionStart = accumulatedLength
      }
      accumulatedLength += l.length() + 1
      if (selection.end < accumulatedLength && !isUpperBoundFrozen) {
        newSelectionEnd = accumulatedLength
        isUpperBoundFrozen = true
      }
    })
    return Selection.fromBounds(newSelectionStart, newSelectionEnd)
  }

  /**
   * @param selection - The selection to extract the subdelta from.
   * @returns The DocumentDelta representing selection
   *
   */
  private getSelected(selection: Selection): DocumentDelta {
    return this.create(this.delta.slice(selection.start, selection.end))
  }

  public compose(delta: Delta): DocumentDelta {
    return this.create(this.delta.compose(delta))
  }

  public create(delta: Delta): DocumentDelta {
    return new DocumentDelta(delta)
  }

  public length() {
    return this.delta.length()
  }

  public concat(delta: Delta | DocumentDelta) {
    return this.create(this.delta.concat(delta instanceof DocumentDelta ? delta.delta : delta))
  }

  public eachLine(predicate: (line: DocumentLine) => void) {
    new LineWalker(this.delta).eachLine(predicate)
  }

  /**
   * Compute a diff between this document delta text and return the resulting atomic update.
   * The first one is the strict result of applying the text diff, while the second one
   * it the result of applying normalization rules (i.e. prefixes rules for text modifying line types).
   *
   * @remarks
   *
   * `cursorTextAttributes` will by applied to inserted characters if and only if `deltaChangeContext.selectionBeforeChange` is of length 0.
   *
   * @param newText - The changed text.
   * @param deltaChangeContext - The context in which the change occurred.
   * @param cursorTextAttributes - Text attributes at cursor.
   * @returns The resulting atomic update from applying the text diff.
   */
  public applyTextDiff(
    newText: string,
    deltaChangeContext: DeltaChangeContext,
    cursorTextAttributes: Attributes.Map = {},
  ): DocumentDeltaAtomicUpdate {
    const oldText = this.getText()
    const computer = new DeltaDiffComputer(
      {
        cursorTextAttributes,
        newText,
        oldText,
        context: deltaChangeContext,
      },
      this,
    )
    const { delta } = computer.toDeltaDiffReport()
    return new DocumentDeltaAtomicUpdate(this.compose(delta), deltaChangeContext.selectionAfterChange)
  }

  /**
   * Determine the line type of given selection.
   *
   * @remarks
   *
   * **Pass algorithm**:
   *
   * If each and every line has its `$type` set to one peculiar value, return this value.
   * Otherwise, return `"normal"`.
   *
   * @param selection - the selection to which line type should be inferred.
   * @returns the line type encompassing the whole selection.
   */
  public getLineTypeInSelection(selection: Selection): Attributes.LineType {
    // TODO inspect inconsistencies between this getSelectionEncompassingLines and Text::getSelectionEncompassingLine
    const selected = this.getSelected(this.getSelectionEncompassingLines(selection))
    const lineAttributes: Attributes.Map[] = []
    selected.delta.eachLine((l, a) => {
      lineAttributes.push(a)
    })
    const firstAttr = head<Attributes.Map>(lineAttributes)
    let type: Attributes.LineType = 'normal'
    if (firstAttr) {
      if (firstAttr.$type == null) {
        return 'normal'
      }
      type = firstAttr.$type as Attributes.LineType
    }
    const isType = lineAttributes.every(v => v.$type === type)
    if (isType) {
      return type
    }
    return 'normal'
  }

  /**
   * Returns the attributes encompassing the given selection.
   * This attribute should be used for user feedback after selection change.
   *
   * @remarks
   *
   * The returned attributes depend on the selection size:
   *
   * - When selection size is `0`, this function returns attributes of the closest character before cursor.
   * - When selection size is `1+`, this function returns a merge of each set of attributes (see merge algorithm bellow).
   *
   * **Merge algorithm**:
   *
   * - for an attribute to be merged in the remaining object, it must be present in every operation traversed by selection;
   * - operations consisting of one newline character insert should be ignored during the traversal, and thus line attributes ignored;
   * - if one attribute name has conflicting values within the selection, none of those values should be picked in the remaining object;
   * - any attribute name with a nil value (`null` or `undefined`) should be ignored in the remaining object.
   *
   * @param selection - the selection from which text attributes should be extracted
   * @returns The resulting merged object
   */
  public getSelectedTextAttributes(selection: Selection): Attributes.Map {
    if (selection.start === selection.end) {
      return getTextAttributesAtCursor(this, selection.start)
    }
    const deltaSelection = this.getSelected(selection)
    const attributesList = deltaSelection.delta
      .filter(op => typeof op.insert === 'string' && op.insert !== '\n')
      .map(op => op.attributes || {})
    const attributes = attributesList.reduce(mergeRight, {})
    const realAttributes = pickBy((value: Attributes.GenericValue, attributeName: string) =>
      attributesList.every(localValue => localValue[attributeName] === value),
    )(attributes)
    return getTextAttributes(realAttributes)
  }

  /**
   * Switch the given attribute's value depending on the state of the given selection:
   *
   * - if **all characters** in the selection have the `attributeName` set to `attributeValue`, **clear** this attribute for all characters in this selection
   * - otherwise set `attributeName`  to `attributeValue` for all characters in this selection
   *
   * @param selectionBeforeChange - The boundaries to which the transforms should be applied
   * @param attributeName - The attribute name to modify
   * @param attributeValue - The attribute value to assign
   */
  public applyTextTransformToSelection(
    selectionBeforeChange: Selection,
    attributeName: string,
    attributeValue: Attributes.GenericValue,
  ): DocumentDeltaAtomicUpdate {
    const allOperationsMatchAttributeValue = this.getSelected(selectionBeforeChange).ops.every(
      op => !!op.attributes && op.attributes[attributeName] === attributeValue,
    )
    const overridingSelection = selectionBeforeChange.length() ? selectionBeforeChange : undefined
    if (allOperationsMatchAttributeValue) {
      const clearAllDelta = new Delta()
      clearAllDelta.retain(selectionBeforeChange.start)
      clearAllDelta.retain(selectionBeforeChange.length(), { [attributeName]: null })
      return new DocumentDeltaAtomicUpdate(this.compose(clearAllDelta), selectionBeforeChange)
    }
    const replaceAllDelta = new Delta()
    replaceAllDelta.retain(selectionBeforeChange.start)
    replaceAllDelta.retain(selectionBeforeChange.length(), { [attributeName]: attributeValue })
    return new DocumentDeltaAtomicUpdate(this.compose(replaceAllDelta), selectionBeforeChange, overridingSelection)
  }
}
