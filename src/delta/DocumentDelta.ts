import Delta from 'quill-delta'
import { BlockAttributesMap, TextAttributesMap, mergeAttributesRight } from './attributes'
import { Selection } from './selection'
import { GenericOp, getOperationLength } from './operations'
import find from 'ramda/es/find'
import mergeRight from 'ramda/es/mergeRight'
import pickBy from 'ramda/es/pickBy'
import { TextLineType, TextLengthModifierLineType } from './transforms'
import head from 'ramda/es/head'
import clone from 'ramda/es/clone'
import omit from 'ramda/es/omit'
import flatten from 'ramda/es/flatten'
import { DocumentLineIndexGenerator } from './DocumentLineIndexGenerator'
import { makeDiffDelta } from './diff'

const getTextAttributes = omit(['$type'])

/**
 * This function returns attributes of the closest character before cursor.
 * 
 * @param delta The full rich text representation
 * @param cursorPosition 
 */
function getTextAttributesAtCursor<T extends string>(delta: DocumentDelta, cursorPosition: number): TextAttributesMap<T> {
  let lowerBound = 0
  const matchedOp = find((op: GenericOp) => {
    const len = getOperationLength(op)
    const upperBound = len + lowerBound
    const match = cursorPosition <= upperBound && cursorPosition >= lowerBound
    lowerBound = upperBound
    return match
  })(delta.ops)
  if (!matchedOp) {
    return {}
  }
  return getTextAttributes(matchedOp.attributes) || {}
}

export function getLineType(lineAttributes?: BlockAttributesMap): TextLineType {
  return (lineAttributes && lineAttributes.$type) ? lineAttributes.$type : 'normal'
}

export function extractTextFromDelta(delta: GenericDelta): string {
  return delta.ops.reduce((acc: string, curr: GenericOp) => typeof curr.insert === 'string' ? acc + curr.insert : acc, '')
}

export interface DeltaChangeContext {
  selectionBeforeChange: Selection
  selectionAfterChange: Selection
}

export interface GenericDelta {
  readonly ops: GenericOp[]
  readonly length: () => number
}

/**
 * **Specifications**: Given `documentText` the string representing all characters of this document,
 * this `line` must have its properties set such that:
 * `documentText.substring(line.beginningOfLineIndex, line.endOfLineIndex) === extractTextFromDelta(line.delta)`
 */
export interface DocumentLine {
  delta: GenericDelta
  index: number
  lineType: TextLineType
  lineTypeIndex: number
  beginningOfLineIndex: number
  endOfLineIndex: number
}

export function getHeadingCharactersFromType(lineType: TextLineType, index: number): string {
  switch (lineType) {
  case 'ol': return `${index + 1}.  `
  case 'ul': return '•  '
  case 'quoted': return '  '
  default: return ''
  }
}

export function getHeadingRegexFromType(lineType: TextLengthModifierLineType): RegExp {
  if (lineType === 'ol') {
    return /^(\d+\.\s\s)/
  }
  return /^(•\s\s)/
}

export function isLineTypeTextLengthModifier(lineType: TextLineType): lineType is TextLengthModifierLineType {
  return lineType === 'ol' || lineType === 'ul'
}

export function shouldLineTypePropagateToNextLine(lineType: TextLineType) {
  return lineType === 'ol' || lineType === 'ul'
}

export function isLineInSelection(selection: Selection, { beginningOfLineIndex, endOfLineIndex }: DocumentLine) {
  return selection.start >= beginningOfLineIndex && selection.start <= endOfLineIndex ||
         selection.start <= endOfLineIndex && selection.end >= beginningOfLineIndex
}

export function getSelectionEncompassingLine(selection: Selection, text: string): Selection {
  let start = selection.start
  let end = selection.end
  while (start > 0 && text.charAt(start - 1) !== '\n') {
    start -= 1
  }
  while (end < text.length && text.charAt(end) !== '\n') {
    end += 1
  }
  return {
    start,
    end
  }
}

export function selectText(selection: Selection, text: string): string {
  return text.substring(selection.start, selection.end)
}

export function getLineDiffDelta(oldText: string, newText: string, context: DeltaChangeContext, textAttributes: BlockAttributesMap): { delta: Delta, diffSelection: Selection, lineBeforeChangeSelection: Selection, lineAfterChangeSelection: Selection } {
  let delta = new Delta()
  const lineBeforeChangeSelection = getSelectionEncompassingLine(context.selectionBeforeChange, oldText)
  const lineAfterChangeSelection = getSelectionEncompassingLine(context.selectionAfterChange, newText)
  const diffSelection = {
    start: lineBeforeChangeSelection.start,
    end: lineAfterChangeSelection.end
  }
  const lineBeforeChange = selectText(lineBeforeChangeSelection, oldText)
  const linesAfterChange = selectText(diffSelection, newText)
  const lineDiff = makeDiffDelta(lineBeforeChange, linesAfterChange, textAttributes)
  delta.retain(lineBeforeChangeSelection.start)
  delta = delta.concat(lineDiff)
  return {
    lineAfterChangeSelection,
    lineBeforeChangeSelection,
    diffSelection,
    delta
  }
}

enum NormalizeOperation {
  INSERT_LINE_TYPE_PREFIX,
  INVESTIGATE_DELETION
}
interface NormalizeDirective {
  type: NormalizeOperation,
  context: DeltaChangeContext
  length: number
  value: string
}

export default class DocumentDelta<T extends string = any> implements GenericDelta {

  get ops() {
    return this.delta.ops
  }

  private delta: Delta

  constructor(arg?: GenericOp[] | DocumentDelta | Delta) {
    this.delta = arg instanceof DocumentDelta ? new Delta(arg.delta) : new Delta(arg)
  }

  private getLineDelimiterForType(lineType: TextLineType) {
    if (lineType === 'normal') {
      return { insert: '\n' }
    }
    return { insert: '\n', attributes: { $type: lineType } }
  }

  private normalize(directive?: NormalizeDirective): DocumentDelta {
    const ops = flatten<GenericOp>(this.mapLines((line) => {
      const { delta: lineDelta, lineType, lineTypeIndex, beginningOfLineIndex } = line
      const requiredPrefix = getHeadingCharactersFromType(lineType, lineTypeIndex)
      if (directive) {
        const { selectionAfterChange } = directive.context
        if (isLineInSelection(selectionAfterChange, line)) {
          if (directive.type === NormalizeOperation.INSERT_LINE_TYPE_PREFIX && shouldLineTypePropagateToNextLine(lineType)) {
            return [{ insert: requiredPrefix }, ...lineDelta.ops, this.getLineDelimiterForType(lineType)]
          }
          if (directive.type === NormalizeOperation.INVESTIGATE_DELETION) {
            const relativeCursorPosition = selectionAfterChange.start - beginningOfLineIndex
            if (isLineTypeTextLengthModifier(lineType) && relativeCursorPosition < requiredPrefix.length) {
              const current = new Delta([...lineDelta.ops, this.getLineDelimiterForType('normal') ])
              const numToDelete = selectionAfterChange.start - beginningOfLineIndex
              const diff = new Delta().delete(numToDelete).retain(current.length() - numToDelete, { $type: null })
              return current.compose(diff).ops
            }
          }
        }
      }
      return [...lineDelta.ops, this.getLineDelimiterForType(lineType)]
    }))
    // return a normalized delta
    return new DocumentDelta(new Delta().compose(new Delta(ops)))
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
    const newSelection = clone(selection)
    let isUpperBoundFrozen = false
    this.delta.eachLine((l, a, i) => {
      if (selection.start > accumulatedLength - 1) {
        newSelection.start = accumulatedLength
      }
      accumulatedLength += l.length() + 1
      if (selection.end < accumulatedLength && !isUpperBoundFrozen) {
        newSelection.end = accumulatedLength
        isUpperBoundFrozen = true
      }
    })
    return newSelection
  }

  private getDeltasFromTextDiff(oldText: string, newText: string, context: DeltaChangeContext, cursorTextAttributes: TextAttributesMap<T>): { delta: Delta, directive?: NormalizeDirective } {
    const selectionBeforeChangeLength = context.selectionBeforeChange.end - context.selectionBeforeChange.start
    const selectedTextAttributes = this.getSelectedTextAttributes(context.selectionBeforeChange)
    const textAttributes = selectionBeforeChangeLength ? selectedTextAttributes : mergeAttributesRight(selectedTextAttributes, cursorTextAttributes)
    const lineTypeBeforeChange = this.getLineTypeInSelection(context.selectionBeforeChange)
    const lineAttributes = lineTypeBeforeChange === 'normal' ? {} : { $type: lineTypeBeforeChange }
    const isOperationDelete = context.selectionBeforeChange.start > context.selectionAfterChange.end
    const isOperationReplace = context.selectionBeforeChange.end > context.selectionBeforeChange.start && !isOperationDelete
    const isOperationInsert = context.selectionBeforeChange.start < context.selectionAfterChange.end && !isOperationReplace
    let directive: NormalizeDirective|undefined
    let delta = new Delta()
    if (isOperationInsert || isOperationReplace) {
      const { delta: lineDiffDelta } = getLineDiffDelta(oldText, newText, context, textAttributes)
      const insertedChars = newText.substring(context.selectionBeforeChange.start, context.selectionAfterChange.end)
      const lastInsertedCharIsNewline = insertedChars.charAt(insertedChars.length - 1) === '\n'
      delta.retain(context.selectionBeforeChange.start)
      delta.delete(context.selectionBeforeChange.end - context.selectionBeforeChange.start)
      if (lastInsertedCharIsNewline) {
        const shouldPropagateLineType = shouldLineTypePropagateToNextLine(lineTypeBeforeChange)
        const shouldKeepExistingNewlineAttributes = oldText.charAt(context.selectionBeforeChange.end) === '\n'
        if (shouldKeepExistingNewlineAttributes) {
          delta.retain(1)
        }
        if (shouldPropagateLineType) {
          if (isLineTypeTextLengthModifier(lineTypeBeforeChange)) {
            directive = {
              context,
              type: NormalizeOperation.INSERT_LINE_TYPE_PREFIX,
              length: insertedChars.length,
              value: insertedChars
            }
          }
        }
        delta.insert(insertedChars.slice(0, insertedChars.length - 1), textAttributes)
        delta.insert('\n', shouldPropagateLineType ? lineAttributes : {})
      } else {
        delta = lineDiffDelta
      }
    } else if (isOperationDelete) {
      const deletedChar = oldText.substr(context.selectionAfterChange.start, context.selectionBeforeChange.start - context.selectionAfterChange.start)
      delta.retain(context.selectionAfterChange.start)
      const shouldDeleteNextNewlineChar = deletedChar.charAt(0) === '\n' && oldText.charAt(context.selectionAfterChange.start + deletedChar.length) === '\n'
      if (shouldDeleteNextNewlineChar) {
        // If the next char is newline, we must retain 1 and delete next newline
        delta.retain(1)
        delta.delete(deletedChar.length)
      } else {
        directive = {
          context,
          type: NormalizeOperation.INVESTIGATE_DELETION,
          length: deletedChar.length,
          value: deletedChar
        }
        delta.delete(context.selectionBeforeChange.end - context.selectionAfterChange.start)
      }
    } else {
      delta = getLineDiffDelta(oldText, newText, context, textAttributes).delta
    }
    return { delta, directive }
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
    const { delta, directive } = this.getDeltasFromTextDiff(originalText, newText, deltaChangeContext, cursorTextAttributes)
    const nuDelta = this.compose(delta).normalize(directive)
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
      selection: {
        start: diffDelta.transformPosition(selection.start),
        end: diffDelta.transformPosition(selection.end)
      },
      delta: new DocumentDelta(this.delta.compose(diffDelta))
    }
  }
}
