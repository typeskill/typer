import { Selection } from './Selection'
import { shouldLineTypePropagateToNextLine, isLineTypeTextLengthModifier, TextLineType, GenericLine, getLineType } from './lines'
import { DeltaChangeContext } from './DeltaChangeContext'
import { BlockAttributesMap } from './attributes'
import Delta from 'quill-delta'
import { makeDiffDelta } from './diff'
import { NormalizeDirectiveBuilder } from './NormalizeDirectiveBuilder'
import { NormalizeOperation } from './DeltaDiffComputer'
import zip from 'ramda/es/zip'
import { DeltaBuffer } from './DeltaBuffer'

interface TextLine extends GenericLine {
  text: string
}

export interface TextDiffContext {
  readonly textAttributes: BlockAttributesMap
  readonly lineAttributes: BlockAttributesMap
  readonly lineTypeBeforeChange: TextLineType
  readonly context: DeltaChangeContext
  readonly oldText: Text
  readonly newText: Text
  readonly directiveBuilder: NormalizeDirectiveBuilder
}

/**
 * Intermediary entity between pure text and {@link quill-delta#Delta the Delta class}.
 * 
 * @remarks
 * 
 * A Text instance represents an absolute-positionned part of the document.
 * We refer to absolute coordinates as **Document coordinates** or index, and relative
 * coordinates as **Text coordiantes** or index.
 */
export default class Text {
  public readonly raw: string
  public readonly beginningIndex: number = 0
  constructor(rawText: string, beginningIndex?: number) {
    this.raw = rawText
    this.beginningIndex = beginningIndex || 0
  }

  private documentToTextIndex(documentIndex: number) {
    return documentIndex - this.beginningIndex
  }

  private textToDocumentIndex(textIndex: number) {
    return textIndex + this.beginningIndex
  }

  get length() {
    return this.raw.length
  }

  /**
   * 
   * @param from Document index of the first character to select.
   * @param to Document index of the last + 1 character to select.
   */
  substring(from: number, to: number): string {
    return this.raw.substring(this.documentToTextIndex(from), this.documentToTextIndex(to))
  }

  /**
   * 
   * @param documentIndex 
   */
  charAt(documentIndex: number): string {
    return this.raw.charAt(this.documentToTextIndex(documentIndex))
  }

  /**
   * 
   * @param documentSelection Document coordinates of selection.
   * @returns A new {@link Text} instance which is a substring of `this` instance with Document coordiantes.
   */
  select(documentSelection: Selection): Text {
    return new Text(this.substring(documentSelection.start, documentSelection.end), documentSelection.start)
  }

  /**
   * Builds the selection matching lines touched by the param `selection`.
   * 
   * @remarks
   * 
   * For N characters, there are N+1 selection indexes. In the example bellow,
   * each character is surrounded by two cursor positions reprented with crosses (`†`).
   * 
   * `†A†B†\n†C†D†\n†`
   * 
   * **Encompassing**
   * 
   * The selection `[0, 2]` encompasses all 2 characters in the line,
   * and selection `[2, 3]` encompasses the newline character. A selection
   * of length 0 never encompasses characters.
   * 
   * The selection encompassing a line always excludes the index referring to the end of the
   * trailing newline character.
   * In the example above, the selection `[1, 2]` would match this line: `[0, 2]`.
   * The selection `[4, 5]` would match this line: `[3, 5]`.
   * 
   * **Multiple lines**
   * 
   * When multiple lines are touched by the param `selection`, index referring
   * to the end of the trailing newline character in sibling lines are included.
   * 
   * Therefore, in the above example, applying the selection `[]` to this function
   * would result in the following selection: `[0, 5]`.
   * 
   * @param documentSelection Document relative selection to which this algorithm apply.
   */
  getSelectionEncompassingLines(documentSelection: Selection): Selection {
    let textStart = documentSelection.start - this.beginningIndex
    let textEnd = documentSelection.end - this.beginningIndex
    while (textStart > 0 && this.raw.charAt(textStart - 1) !== '\n') {
      textStart -= 1
    }
    while (textEnd < this.raw.length && this.raw.charAt(textEnd) !== '\n') {
      textEnd += 1
    }
    return Selection.fromBounds(this.textToDocumentIndex(textStart), this.textToDocumentIndex(textEnd))
  }

  /**
   * @returns A list of lines.
   */
  getLines(): TextLine[] {
    let charIndex = this.beginningIndex - 1
    let lineIndex = -1
    const lines = this.raw.split('\n')
    return lines.map((text) => {
      const start = charIndex + 1
      charIndex = start + text.length
      lineIndex += 1
      const lineRange = Selection.fromBounds(start, charIndex)
      return {
        text,
        lineRange,
        index: lineIndex
      }
    })
  }

  computeGenericDelta(diffContext: TextDiffContext): Delta {
    const { context, newText, textAttributes, lineTypeBeforeChange, lineAttributes, directiveBuilder } = diffContext
    const lineBeforeChangeSelection = this.getSelectionEncompassingLines(context.selectionBeforeChange)
    const lineAfterChangeSelection = newText.getSelectionEncompassingLines(context.selectionAfterChange)
    const lineChangeContext = new DeltaChangeContext(lineBeforeChangeSelection, lineAfterChangeSelection)
    const selectionTraversalBeforeChange = lineChangeContext.deleteTraversal()
    const selectionTraversalAfterChange = Selection.between(selectionTraversalBeforeChange.start, lineAfterChangeSelection.end)
    const buffer = new DeltaBuffer()
    const textBeforeChange = this.select(selectionTraversalBeforeChange)
    const textAfterChange = newText.select(selectionTraversalAfterChange)
    const linesBeforeChange = textBeforeChange.getLines()
    const linesAfterChange = textAfterChange.getLines()
    buffer.push(new Delta().retain(selectionTraversalBeforeChange.start))
    const shouldPropagateLineType = shouldLineTypePropagateToNextLine(lineTypeBeforeChange)
    const replacedLines = zip(linesBeforeChange, linesAfterChange)
    const lineType = getLineType(lineAttributes)
    let shouldDeleteNextNewline = false
    // Replaced lines
    replacedLines.forEach(([lineBefore, lineAfter]) => {
      const lineDelta = makeDiffDelta(lineBefore.text, lineAfter.text, textAttributes)
      if (isLineTypeTextLengthModifier(lineType) && context.isDeletion() && lineAfter.lineRange.touchesSelection(context.selectionAfterChange)) {
        directiveBuilder.pushDirective(NormalizeOperation.INVESTIGATE_DELETION, lineAfter.lineRange.start, lineDelta)
      } else if (isLineTypeTextLengthModifier(lineType)) {
        directiveBuilder.pushDirective(NormalizeOperation.CHECK_LINE_TYPE_PREFIX, lineAfter.lineRange.start, lineDelta)
      }
      if (this.charAt(lineBefore.lineRange.end) !== '\n') {
        lineDelta.insert('\n', shouldPropagateLineType ? lineAttributes : {})
      } else {
        lineDelta.retain(1) // Keep first newline
        shouldDeleteNextNewline = context.isDeletion() &&
                            selectionTraversalBeforeChange.touchesIndex(lineBefore.lineRange.end)
      }
      buffer.push(lineDelta)
    })
    // Inserted lines
    linesAfterChange.slice(replacedLines.length).forEach((lineAfter) => {
      const lineDelta = makeDiffDelta('', lineAfter.text, textAttributes)
      lineDelta.insert('\n', shouldPropagateLineType ? lineAttributes : {})
      if (isLineTypeTextLengthModifier(lineTypeBeforeChange)) {
        directiveBuilder.pushDirective(NormalizeOperation.INSERT_LINE_TYPE_PREFIX, lineAfter.lineRange.start, lineDelta)
      }
      buffer.push(lineDelta)
    })
    // Deleted lines
    linesBeforeChange.slice(replacedLines.length).forEach((lineBefore) => {
      const { start: beginningOfLineIndex } = lineBefore.lineRange
      const lineDelta = makeDiffDelta(lineBefore.text, '', textAttributes)
      if (beginningOfLineIndex < selectionTraversalBeforeChange.end || shouldDeleteNextNewline) {
        lineDelta.delete(1)
        shouldDeleteNextNewline = false
      }
      buffer.push(lineDelta)
    })
    return buffer.compose()
  }
}
