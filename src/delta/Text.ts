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

export default class Text {
  public readonly raw: string
  public readonly beginningIndex: number = 0
  constructor(rawText: string, beginningIndex?: number) {
    this.raw = rawText
    this.beginningIndex = beginningIndex || 0
  }

  get length() {
    return this.raw.length
  }

  substring(from: number, to: number): string {
    return this.raw.substring(from - this.beginningIndex, to - this.beginningIndex)
  }

  charAt(absoluteIndex: number): string {
    return this.raw.charAt(absoluteIndex - this.beginningIndex)
  }

  select(selection: Selection): Text {
    return new Text(this.substring(selection.start, selection.end), selection.start + this.beginningIndex)
  }

  getSelectionEncompassingLine(selection: Selection): Selection {
    let relativeStart = selection.start - this.beginningIndex
    let relativeEnd = selection.end - this.beginningIndex
    while (relativeStart > 0 && this.raw.charAt(relativeStart - 1) !== '\n') {
      relativeStart -= 1
    }
    while (relativeEnd < this.raw.length && this.raw.charAt(relativeEnd) !== '\n') {
      relativeEnd += 1
    }
    return Selection.fromBounds(relativeStart + this.beginningIndex, relativeEnd + this.beginningIndex)
  }

  getLines(): TextLine[] {
    let charIndex = this.beginningIndex - 1
    let lineIndex = -1
    const lines = this.raw.split('\n')
    return lines.map((text) => {
      const start = charIndex + 1
      charIndex = start + text.length
      lineIndex += 1
      return {
        text,
        index: lineIndex,
        beginningOfLineIndex: start,
        endOfLineIndex: charIndex
      }
    })
  }

  computeGenericDelta(diffContext: TextDiffContext): Delta {
    const { context, newText, textAttributes, lineTypeBeforeChange, lineAttributes, directiveBuilder } = diffContext
    const lineBeforeChangeSelection = this.getSelectionEncompassingLine(context.selectionBeforeChange)
    const lineAfterChangeSelection = newText.getSelectionEncompassingLine(context.selectionAfterChange)
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
      if (isLineTypeTextLengthModifier(lineType)) {
        directiveBuilder.pushDirective(NormalizeOperation.CHECK_LINE_TYPE_PREFIX, lineBefore.beginningOfLineIndex, lineDelta.invert(new Delta().insert(lineBefore)))
      }
      if (this.charAt(lineBefore.endOfLineIndex) !== '\n') {
        lineDelta.insert('\n', shouldPropagateLineType ? lineAttributes : {})
      } else {
        lineDelta.retain(1) // Keep first newline
        shouldDeleteNextNewline = context.isDeletion() &&
                            selectionTraversalBeforeChange.encompasses(lineBefore.endOfLineIndex)
      }
      buffer.push(lineDelta)
    })
    // Inserted lines
    linesAfterChange.slice(replacedLines.length).forEach((lineAfter) => {
      const lineDelta = makeDiffDelta('', lineAfter.text, textAttributes)
      lineDelta.insert('\n', shouldPropagateLineType ? lineAttributes : {})
      if (isLineTypeTextLengthModifier(lineTypeBeforeChange)) {
        directiveBuilder.pushDirective(NormalizeOperation.INSERT_LINE_TYPE_PREFIX, lineAfter.beginningOfLineIndex)
      }
      buffer.push(lineDelta)
    })
    // Deleted lines
    linesBeforeChange.slice(replacedLines.length).forEach((lineBefore) => {
      const lineDelta = makeDiffDelta(lineBefore.text, '', textAttributes)
      if (lineBefore.beginningOfLineIndex < selectionTraversalBeforeChange.end || shouldDeleteNextNewline) {
        lineDelta.delete(1)
        shouldDeleteNextNewline = false
      }
      buffer.push(lineDelta)
    })
    if (context.isDeletion()) {
      directiveBuilder.pushDirective(NormalizeOperation.INVESTIGATE_DELETION, lineBeforeChangeSelection.start)
    }
    return buffer.compose()
  }
}
