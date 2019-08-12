import { Selection } from './Selection'
import { Attributes } from './attributes'

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
 * ```
 * @internal
 */
export interface GenericLine {
  index: number
  lineRange: Selection
}

export function isLineInSelection(selection: Selection, { lineRange }: GenericLine) {
  const { start: beginningOfLineIndex, end: endOfLineIndex } = lineRange
  return (
    (selection.start >= beginningOfLineIndex && selection.start <= endOfLineIndex) ||
    (selection.start <= endOfLineIndex && selection.end >= beginningOfLineIndex)
  )
}

export function getLineType(lineAttributes?: Attributes.Map): Attributes.LineType {
  return lineAttributes && lineAttributes.$type ? (lineAttributes.$type as Attributes.LineType) : 'normal'
}
