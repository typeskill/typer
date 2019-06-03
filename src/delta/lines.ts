import { Selection } from './Selection'
import { BlockAttributesMap } from './attributes'
import { GenericDelta } from './generic'
import { makeDiffDelta } from './diff'
import Delta from 'quill-delta'
import { DeltaChangeContext } from './DeltaChangeContext'

export type TextLengthModifierLineType = 'ol' | 'ul'

export type TextLineType = 'normal' | 'quoted' | TextLengthModifierLineType

export interface GenericLine {
  index: number
  beginningOfLineIndex: number
  endOfLineIndex: number
}

export interface TextLine extends GenericLine {
  text: string
}

/**
 * **Specifications**: Given `documentText` the string representing all characters of this document,
 * this `line` must have its properties set such that:
 * `documentText.substring(line.beginningOfLineIndex, line.endOfLineIndex) === extractTextFromDelta(line.delta)`
 */
export interface DocumentLine extends GenericLine {
  delta: GenericDelta
  lineType: TextLineType
  lineTypeIndex: number
}

export function isLineTypeTextLengthModifier(lineType: TextLineType): lineType is TextLengthModifierLineType {
  return lineType === 'ol' || lineType === 'ul'
}

export function shouldLineTypePropagateToNextLine(lineType: TextLineType) {
  return lineType === 'ol' || lineType === 'ul'
}

export function doesSelectionEncompassLine(selection: Selection, { beginningOfLineIndex, endOfLineIndex }: GenericLine) {
  return selection.start <= beginningOfLineIndex && selection.end > endOfLineIndex
}

export function isLineInSelection(selection: Selection, { beginningOfLineIndex, endOfLineIndex }: GenericLine) {
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
  return Selection.fromBounds(start, end)
}

export function getLineType(lineAttributes?: BlockAttributesMap): TextLineType {
  return (lineAttributes && lineAttributes.$type) ? lineAttributes.$type : 'normal'
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

export function getLineDiffDelta(oldText: string, newText: string, context: DeltaChangeContext, textAttributes: BlockAttributesMap): { delta: Delta, diffSelection: Selection, lineBeforeChangeSelection: Selection, lineAfterChangeSelection: Selection } {
  let delta = new Delta()
  const lineBeforeChangeSelection = getSelectionEncompassingLine(context.selectionBeforeChange, oldText)
  const lineAfterChangeSelection = getSelectionEncompassingLine(context.selectionAfterChange, newText)
  const diffSelection = Selection.fromObject({
    start: lineBeforeChangeSelection.start,
    end: lineAfterChangeSelection.end
  })
  const lineBeforeChange = lineBeforeChangeSelection.selectText(oldText)
  const linesAfterChange = diffSelection.selectText(newText)
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
