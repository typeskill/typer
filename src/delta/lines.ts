import { Selection } from './Selection'
import { BlockAttributesMap } from './attributes'

export type TextLengthModifierLineType = 'ol' | 'ul'

export type TextLineType = 'normal' | 'quoted' | TextLengthModifierLineType

/**
 * **Specifications**: Given `documentText` the string representing all characters of this document,
 * this `line` must have its properties set such that:
 * `documentText.substring(line.beginningOfLineIndex, line.endOfLineIndex) === extractTextFromDelta(line.delta)`
 */
export interface GenericLine {
  index: number
  beginningOfLineIndex: number
  endOfLineIndex: number
}

export function isLineTypeTextLengthModifier(lineType: TextLineType): lineType is TextLengthModifierLineType {
  return lineType === 'ol' || lineType === 'ul'
}

export function shouldLineTypePropagateToNextLine(lineType: TextLineType) {
  return lineType === 'ol' || lineType === 'ul'
}

export function isLineInSelection(selection: Selection, { beginningOfLineIndex, endOfLineIndex }: GenericLine) {
  return selection.start >= beginningOfLineIndex && selection.start <= endOfLineIndex ||
         selection.start <= endOfLineIndex && selection.end >= beginningOfLineIndex
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
