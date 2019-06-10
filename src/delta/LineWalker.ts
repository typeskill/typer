import { GenericOp } from './operations'
import { DocumentLineIndexGenerator } from './DocumentLineIndexGenerator'
import { getLineType, TextLineType, GenericLine } from './lines'
import Delta from 'quill-delta'
import { GenericDelta, isGenericDelta } from './generic'
import { Selection } from './Selection'

export interface DocumentLine extends GenericLine {
  delta: Delta
  lineType: TextLineType
  lineTypeIndex: number
}

export class LineWalker {
  public readonly ops: GenericOp[]
  constructor(arg: GenericOp[]|GenericDelta) {
    this.ops = isGenericDelta(arg) ? arg.ops : arg
  }

  eachLine(predicate: (line: DocumentLine) => void) {
    const generator = new DocumentLineIndexGenerator()
    let firstLineCharAt = 0
    new Delta(this.ops).eachLine((delta, attributes, index) => {
      const beginningOfLineIndex = firstLineCharAt
      const endOfLineIndex = beginningOfLineIndex + delta.length()
      firstLineCharAt = endOfLineIndex + 1 // newline
      const lineType = getLineType(attributes)
      const lineTypeIndex = generator.findNextLineTypeIndex(lineType)
      const lineRange = Selection.fromBounds(beginningOfLineIndex, endOfLineIndex)
      predicate({
        lineRange,
        delta,
        lineType,
        lineTypeIndex,
        index
      })
    })
  }

  getLines() {
    const lines: DocumentLine[] = []
    this.eachLine(l => lines.push(l))
    return lines
  }
}
