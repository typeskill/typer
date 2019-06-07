import { GenericOp } from './operations'
import { DocumentLineIndexGenerator } from './DocumentLineIndexGenerator'
import { getLineType, TextLineType, GenericLine } from './lines'
import Delta from 'quill-delta'

export interface DocumentLine extends GenericLine {
  delta: Delta
  lineType: TextLineType
  lineTypeIndex: number
}

export class LineWalker {
  public readonly ops: GenericOp[]
  constructor(arg: GenericOp[]|Delta) {
    this.ops = arg instanceof Delta ? arg.ops : arg
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

  getLines() {
    const lines: DocumentLine[] = []
    this.eachLine(l => lines.push(l))
    return lines
  }
}
