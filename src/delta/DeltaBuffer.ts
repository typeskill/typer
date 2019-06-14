import Delta from 'quill-delta'

export class DeltaBuffer {
  private chunks: Delta[] = []

  public push(...delta: Delta[]) {
    this.chunks.push(...delta)
  }

  public compose() {
    return this.chunks.reduce((prev, curr) => prev.concat(curr), new Delta())
  }
}
