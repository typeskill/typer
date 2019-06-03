import Delta from 'quill-delta'
import { GenericOp } from './operations'

export class DeltaBuffer {
  private chunks: Delta[] = []

  pushOps(genericOps: GenericOp[]) {
    this.chunks.push(new Delta(genericOps))
  }

  push(...delta: Delta[]) {
    this.chunks.push(...delta)
  }

  compose() {
    return this.chunks.reduce((prev, curr) => prev.concat(curr), new Delta())
  }
}
