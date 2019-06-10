import { Selection } from './Selection'
import { BlockAttributesMap } from './attributes'

export type TextLengthModifierLineType = 'ol' | 'ul'

export type TextLineType = 'normal' | 'quoted' | TextLengthModifierLineType

/**
 * An interface representing a line of text.
 * 
 * @remarks
 * 
 * Given `documentText` the string representing all characters of a document and `line`
 * any instance complying with this interface extracted from `documentText`, the following must
 * be true:
 * 
 * ```ts
 * documentText.substring(line.lineRange.start, line.lineRange.end) === extractTextFromDelta(line.delta)
 * documentText.charAt(line.lineRange.end) === '\n'
 * ```
 */
export interface GenericLine {
  index: number
  lineRange: Selection
}

export function isLineTypeTextLengthModifier(lineType: TextLineType): lineType is TextLengthModifierLineType {
  return lineType === 'ol' || lineType === 'ul'
}

export function shouldLineTypePropagateToNextLine(lineType: TextLineType) {
  return lineType === 'ol' || lineType === 'ul'
}

export function isLineInSelection(selection: Selection, { lineRange }: GenericLine) {
  const { start: beginningOfLineIndex, end: endOfLineIndex } = lineRange
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
