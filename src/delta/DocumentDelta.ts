import Delta from 'quill-delta'
import { BlockAttributesMap, TextAttributesMap, getTextAttributesAtCursor, getTextAttributes } from './attributes'
import { Selection } from './Selection'
import { GenericOp } from './operations'
import mergeRight from 'ramda/es/mergeRight'
import pickBy from 'ramda/es/pickBy'
import { TextLineType, getHeadingCharactersFromType, isLineInSelection, isLineTypeTextLengthModifier, DocumentLine, getLineType, getHeadingRegexFromType } from './lines'
import head from 'ramda/es/head'
import { DocumentLineIndexGenerator } from './DocumentLineIndexGenerator'
import { GenericDelta, extractTextFromDelta } from './generic'
import { DeltaDiffComputer, NormalizeDirective, NormalizeOperation } from './DeltaDiffComputer'
import { DeltaChangeContext } from './DeltaChangeContext'

export default class DocumentDelta<T extends string = any> implements GenericDelta {

  get ops() {
    return this.delta.ops
  }

  private delta: Delta

  constructor(arg?: GenericOp[] | DocumentDelta | Delta) {
    this.delta = arg instanceof DocumentDelta ? new Delta(arg.delta) : new Delta(arg)
  }

  private normalize(directives: NormalizeDirective[]): DocumentDelta {
    const diffDelta = new Delta()
    this.eachLine((line) => {
      const { lineType, lineTypeIndex, beginningOfLineIndex } = line
      const requiredPrefix = getHeadingCharactersFromType(lineType, lineTypeIndex)
      let numToDelete = 0
      let lineAttributes = {}
      let charsToInsert = ''
      directives.forEach((directive) => {
        const { beginningOfLineIndex: directiveIndex } = directive
        const { selectionAfterChange } = directive.context
        const matchingLine = directiveIndex === beginningOfLineIndex
        const relativeCursorPosition = selectionAfterChange.start - beginningOfLineIndex
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
          // TODO: handle paste text overriding prefix
          numToDelete = requiredPrefix.length - alreadyDeletedChars
          lineAttributes = { $type: null }
        }
      })
      diffDelta
        .delete(numToDelete)
        .insert(charsToInsert)
        .retain(line.delta.length() - numToDelete)
        .retain(1, lineAttributes)
    })
    // console.info('NORMALIZE DELTA', JSON.stringify(diffDelta, null, 2))
    return this.compose(diffDelta)
  }

  private retain(length: number, attributes?: BlockAttributesMap): DocumentDelta {
    return new DocumentDelta(this.delta.retain(length, attributes))
  }

  private compose(delta: Delta | DocumentDelta): DocumentDelta {
    return new DocumentDelta(this.delta.compose(delta instanceof Delta ? delta : delta.delta))
  }

  private slice(start?: number, end?: number): DocumentDelta {
    return new DocumentDelta(this.delta.slice(start, end))
  }

  private getText(): string {
    return extractTextFromDelta(this.delta)
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

  private getDeltasFromTextDiff(oldText: string, newText: string, context: DeltaChangeContext, cursorTextAttributes: TextAttributesMap<T>) {
    const computer = new DeltaDiffComputer({
      context,
      cursorTextAttributes,
      newText,
      oldText
    }, this)
    return computer.toDeltaDiffReport()
  }

  length() {
    return this.delta.length()
  }

  concat(delta: Delta | DocumentDelta) {
    return new DocumentDelta(this.delta.concat(delta instanceof DocumentDelta ? delta.delta : delta))
  }

  eachLine(predicate: (line: DocumentLine) => void) {
    const generator = new DocumentLineIndexGenerator()
    let firstLineCharAt = 0
    this.delta.eachLine((delta, attributes, index) => {
      const beginningOfLineIndex = firstLineCharAt
      const endOfLineIndex = beginningOfLineIndex + delta.length()
      firstLineCharAt = endOfLineIndex + 1 // newline
      const lineType = getLineType(attributes)
      const lineTypeIndex = generator.findNextLineTypeIndex(lineType)
      predicate({
        beginningOfLineIndex,
        endOfLineIndex,
        delta,
        lineType,
        lineTypeIndex,
        index
      })
    })
  }

  mapLines<P>(mapper: (line: DocumentLine) => P): P[] {
    const pArray: P[] = []
    this.eachLine((l) => { pArray.push(mapper(l)) })
    return pArray
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
    const originalText = this.getText()
    const { delta, directives } = this.getDeltasFromTextDiff(originalText, newText, deltaChangeContext, cursorTextAttributes)
    const compositeDelta = this.compose(delta)
    const nuDelta = compositeDelta.normalize(directives)
    return nuDelta
  }

  /**
   * @param selection
   * @returns The DocumentDelta representing selection
   * 
   */
  getSelected(selection: Selection): DocumentDelta {
    return this.slice(selection.start, selection.end)
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
      const clearAllDelta = new DocumentDelta()
      clearAllDelta.retain(selection.start)
      clearAllDelta.retain(selectionLength, { [attributeName]: null })
      return this.compose(clearAllDelta)
    }
    const replaceAllDelta = new DocumentDelta()
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
   * @returns An object describing both delta and selection after applying line type.
   */
  applyLineTypeToSelection(selection: Selection, userLineType: TextLineType): { delta: DocumentDelta, selection: Selection } {
    const selectionLineType = this.getLineTypeInSelection(selection)
    const diffDelta = new Delta()
    const generator = new DocumentLineIndexGenerator()
    if (!this.ops.length) {
      // Special condition where the delta is empty, hence cannot update on non existing line.
      const tempDelta = new DocumentDelta(diffDelta.insert('\n'))
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
    return {
      selection: Selection.fromBounds(diffDelta.transformPosition(selection.start), diffDelta.transformPosition(selection.end)),
      delta: new DocumentDelta(this.delta.compose(diffDelta))
    }
  }
}
