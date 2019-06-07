import Delta from 'quill-delta'
import { BlockAttributesMap, TextAttributesMap, getTextAttributesAtCursor, getTextAttributes } from './attributes'
import { Selection } from './Selection'
import { GenericOp } from './operations'
import mergeRight from 'ramda/es/mergeRight'
import pickBy from 'ramda/es/pickBy'
import { TextLineType, getHeadingCharactersFromType, isLineInSelection, isLineTypeTextLengthModifier, getHeadingRegexFromType } from './lines'
import head from 'ramda/es/head'
import { DocumentLineIndexGenerator } from './DocumentLineIndexGenerator'
import { GenericDelta, extractTextFromDelta, isMutatingDelta } from './generic'
import { DeltaDiffComputer, NormalizeDirective, NormalizeOperation } from './DeltaDiffComputer'
import { DeltaChangeContext } from './DeltaChangeContext'
import Orchestrator from '@model/Orchestrator'
import { DeltaBuffer } from './DeltaBuffer'
import { DocumentLine, LineWalker } from './LineWalker'

export default class DocumentDelta<T extends string = any> implements GenericDelta {

  get ops() {
    return this.delta.ops
  }

  private delta: Delta
  private text: string|null = null
  private emitterInterface: Orchestrator.BlockEmitterInterface

  constructor(controller: Orchestrator.BlockEmitterInterface, arg?: GenericOp[] | DocumentDelta | Delta) {
    this.delta = arg instanceof DocumentDelta ? new Delta(arg.delta) : new Delta(arg)
    this.emitterInterface = controller
  }

  private normalize(directives: NormalizeDirective[]): DocumentDelta {
    const diffBuffer = new DeltaBuffer()
    let overridenSelection: Selection|null = null
    this.eachLine((line) => {
      const { lineType, lineTypeIndex, beginningOfLineIndex } = line
      const requiredPrefix = getHeadingCharactersFromType(lineType, lineTypeIndex)
      let numToDelete = 0
      let numToRetainInPrefix = 0
      let lineAttributes = {}
      let charsToInsert = ''
      directives.forEach((directive) => {
        const { beginningOfLineIndex: directiveIndex } = directive
        const { selectionAfterChange } = directive.context
        const matchingLine = directiveIndex === beginningOfLineIndex
        const relativeCursorPosition = selectionAfterChange.start - beginningOfLineIndex
        const shouldInvestigatePrefix = matchingLine &&
                                        directive.type === NormalizeOperation.CHECK_LINE_TYPE_PREFIX
        const shouldInvestigateInsertion = matchingLine &&
                                           directive.type === NormalizeOperation.INSERT_LINE_TYPE_PREFIX
        const shouldInvestigateDeletion = matchingLine &&
                                          directive.type === NormalizeOperation.INVESTIGATE_DELETION &&
                                          relativeCursorPosition < requiredPrefix.length &&
                                          isLineTypeTextLengthModifier(line.lineType)
        if (shouldInvestigateInsertion) {
          charsToInsert = requiredPrefix
        } else if (shouldInvestigateDeletion) {
          const deleteTraversal = directive.context.deleteTraversal()
          const prefixTraversal = Selection.fromBounds(line.beginningOfLineIndex, line.beginningOfLineIndex + requiredPrefix.length)
          const alreadyDeletedChars = prefixTraversal.intersection(deleteTraversal).length()
          numToDelete = requiredPrefix.length - alreadyDeletedChars
          lineAttributes = { $type: null }
          overridenSelection = Selection.fromBounds(line.beginningOfLineIndex)
        } else if (shouldInvestigatePrefix) {
          const diff = (directive.diff as Delta).slice(0, requiredPrefix.length)
          if (isMutatingDelta(diff)) {
            const iterator = Delta.Op.iterator(diff.ops)
            while (iterator.hasNext()) {
              const next = iterator.next()
              if (next.retain && !numToRetainInPrefix) {
                numToRetainInPrefix = next.retain
              } else if (next.delete) {
                numToDelete = next.delete
              }
            }
            overridenSelection = Selection.fromBounds(requiredPrefix.length)
          }
        }
      })
      diffBuffer.push(new Delta()
        .retain(numToRetainInPrefix)
        .delete(numToDelete)
        .insert(charsToInsert)
        .retain(line.delta.length() - numToDelete - numToRetainInPrefix)
        .retain(1, lineAttributes))
    })
    overridenSelection && this.overrideSelection(overridenSelection)
    return this.compose(diffBuffer.compose())
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
   * @param selection 
   */
  private getSelectionEncompassingLines(selection: Selection): Selection {
    let accumulatedLength = 0
    let newSelectionStart = selection.start
    let newSelectionEnd = selection.end
    let isUpperBoundFrozen = false
    this.delta.eachLine((l, a, i) => {
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

  private overrideSelection(selection: Selection) {
    this.emitterInterface.emitToBlockController('SELECTION_OVERRIDE', selection)
  }

  compose(delta: Delta): DocumentDelta {
    return this.create(this.delta.compose(delta))
  }

  create(delta: Delta): DocumentDelta {
    return new DocumentDelta(this.emitterInterface, delta)
  }

  length() {
    return this.delta.length()
  }

  concat(delta: Delta | DocumentDelta) {
    return this.create(this.delta.concat(delta instanceof DocumentDelta ? delta.delta : delta))
  }

  eachLine(predicate: (line: DocumentLine) => void) {
    new LineWalker(this.delta).eachLine(predicate)
  }

  /**
   * Compute a diff between this document delta text and return the result of
   * composing the diff delta with `this` instance.
   * 
   * @remarks
   * 
   * `cursorTextAttributes` will by applied to inserted characters if and only if `deltaChangeContext.selectionBeforeChange` is of length 0.
   * 
   * @param newText - The changed text.
   * @param deltaChangeContext - The context in which the change occurred.
   * @param cursorTextAttributes - Text attributes at cursor.
   * @returns The result of composing the diff delta with `this` instance.
   */
  applyTextDiff(newText: string, deltaChangeContext: DeltaChangeContext, cursorTextAttributes: TextAttributesMap<T> = {}): DocumentDelta {
    const oldText = this.getText()
    const computer = new DeltaDiffComputer({
      cursorTextAttributes,
      newText,
      oldText,
      context: deltaChangeContext
    }, this)
    const { delta, directives } = computer.toDeltaDiffReport()
    return this.compose(delta).normalize(directives)
  }

  /**
   * @param selection
   * @returns The DocumentDelta representing selection
   * 
   */
  getSelected(selection: Selection): DocumentDelta {
    return this.create(this.delta.slice(selection.start, selection.end))
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
  getLineTypeInSelection(selection: Selection): TextLineType {
    // TODO inspect inconsistencies between this getSelectionEncompassingLines and Text::getSelectionEncompassingLine
    const selected = this.getSelected(this.getSelectionEncompassingLines(selection))
    const lineAttributes: BlockAttributesMap[] = []
    selected.delta.eachLine((l, a, i) => { lineAttributes.push(a) })
    const firstAttr = head(lineAttributes)
    let type: TextLineType = 'normal'
    if (firstAttr) {
      if (firstAttr.$type == null) {
        return 'normal'
      }
      type = firstAttr.$type
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
  getSelectedTextAttributes(selection: Selection): TextAttributesMap<T> {
    if (selection.start === selection.end) {
      return getTextAttributesAtCursor(this, selection.start)
    }
    const deltaSelection = this.getSelected(selection)
    const attributesList = deltaSelection.delta
      .filter(op => typeof op.insert === 'string' && op.insert !== '\n')
      .map(op => op.attributes || {})
    const attributes = attributesList.reduce(mergeRight, {})
    const realAttributes = pickBy((value: any, attributeName: string) => attributesList.every(localValue => localValue[attributeName] === value))(attributes)
    return getTextAttributes(realAttributes)
  }

  /**
   * Switch the given attribute's value depending on the state of the given selection:
   * 
   * - if **all characters** in the selection have the `attributeName` set to `attributeValue`, **clear** this attribute for all characters in this selection
   * - otherwise set `attributeName`  to `attributeValue` for all characters in this selection
   * 
   * @param selection - The boundaries to which the transforms should be applied
   * @param attributeName - The attribute name to modify
   * @param attributeValue - The attribute value to assign
   */
  applyTextTransformToSelection(selection: Selection, attributeName: T, attributeValue: any): DocumentDelta {
    const allOperationsMatchAttributeValue = this.getSelected(selection).ops.every(op => !!op.attributes && op.attributes[attributeName] === attributeValue)
    const selectionLength = selection.end - selection.start
    if (allOperationsMatchAttributeValue) {
      const clearAllDelta = new Delta()
      clearAllDelta.retain(selection.start)
      clearAllDelta.retain(selectionLength, { [attributeName]: null })
      return this.compose(clearAllDelta)
    }
    const replaceAllDelta = new Delta()
    replaceAllDelta.retain(selection.start)
    replaceAllDelta.retain(selectionLength, { [attributeName]: attributeValue })
    return this.compose(replaceAllDelta)
  }

  /**
   * Swtich the `$type` of lines traversed by selection, depending of its sate.
   * 
   * @remarks
   * 
   * - if **all** lines traversed by selection have their `$type` set to `lineType`, set `$type` to `"normal"` for each of these lines;
   * - otherwise, set `$type` to `lineType` for each of these lines.
   * 
   * Calling this function will also iterate over each out of selection lines to update
   * their prefix when appropriate.
   * 
   * @param selection 
   * @param userLineType 
   * @returns The delta resulting from applying this line type.
   */
  applyLineTypeToSelection(selection: Selection, userLineType: TextLineType): DocumentDelta {
    const selectionLineType = this.getLineTypeInSelection(selection)
    const diffDelta = new Delta()
    const generator = new DocumentLineIndexGenerator()
    if (!this.ops.length) {
      // Special condition where the delta is empty, hence cannot update on non existing line.
      const tempDelta = this.create(diffDelta.insert('\n'))
      return tempDelta.applyLineTypeToSelection(selection, userLineType)
    }
    this.eachLine((line) => {
      const { lineTypeIndex: currentLineTypeIndex, delta: lineDelta, lineType: currentLineType } = line
      const lineInSelection = isLineInSelection(selection, line)
      const nextLineType = lineInSelection ? selectionLineType !== userLineType ? userLineType : 'normal' : currentLineType
      const nextLineTypeIndex = generator.findNextLineTypeIndex(nextLineType)
      if (lineInSelection && isLineTypeTextLengthModifier(currentLineType) && nextLineType === 'normal') {
        const currentText = extractTextFromDelta(lineDelta)
        const matchedPrefix = getHeadingRegexFromType(currentLineType).exec(currentText)
        if (matchedPrefix) {
          const [_, matchedString] = matchedPrefix
          diffDelta.delete(matchedString.length)
          diffDelta.retain(lineDelta.length() - matchedString.length)
        } else {
          diffDelta.retain(lineDelta.length())
        }
        diffDelta.retain(1, { $type: null })
      } else if (lineInSelection && isLineTypeTextLengthModifier(currentLineType) && isLineTypeTextLengthModifier(nextLineType)) {
        const currentText = extractTextFromDelta(lineDelta)
        const matchedPrefix = getHeadingRegexFromType(currentLineType).exec(currentText)
        const requiredPrefix = getHeadingCharactersFromType(nextLineType, nextLineTypeIndex)
        let retainLength = lineDelta.length()
        if (matchedPrefix) {
          const [_, matchedString] = matchedPrefix
          diffDelta.delete(matchedString.length)
          retainLength = lineDelta.length() - matchedString.length
        }
        diffDelta.insert(requiredPrefix)
        diffDelta.retain(retainLength)
        diffDelta.retain(1, { $type: nextLineType })
      } else if (lineInSelection && isLineTypeTextLengthModifier(nextLineType)) {
        const requiredPrefix = getHeadingCharactersFromType(nextLineType, nextLineTypeIndex)
        const currentPrefix = extractTextFromDelta(lineDelta).substr(0, requiredPrefix.length)
        if (currentPrefix !== requiredPrefix) {
          diffDelta.insert(requiredPrefix)
        }
        diffDelta.retain(lineDelta.length())
        diffDelta.retain(1, { $type: nextLineType })
      } else if (lineInSelection && nextLineType !== 'normal') {
        diffDelta.retain(lineDelta.length())
        diffDelta.retain(1, { $type: nextLineType })
      } else if (!lineInSelection && currentLineType === 'ol' && currentLineType === nextLineType && currentLineTypeIndex !== nextLineTypeIndex) {
        const currentText = extractTextFromDelta(lineDelta)
        const matchedPrefix = getHeadingRegexFromType(currentLineType).exec(currentText)
        const requiredPrefix = getHeadingCharactersFromType(nextLineType, nextLineTypeIndex)
        let retainLength = lineDelta.length()
        if (matchedPrefix) {
          const [_, matchedString] = matchedPrefix
          diffDelta.delete(matchedString.length)
          retainLength = lineDelta.length() - matchedString.length
        }
        diffDelta.insert(requiredPrefix)
        diffDelta.retain(retainLength)
        diffDelta.retain(1)
      } else {
        diffDelta.retain(lineDelta.length() + 1)
      }
    })
    this.overrideSelection(Selection.fromBounds(diffDelta.transformPosition(selection.start), diffDelta.transformPosition(selection.end)))
    return this.compose(diffDelta)
  }
}
