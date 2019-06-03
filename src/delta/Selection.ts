import invariant from 'invariant'

export class Selection {
  public readonly start: number
  public readonly end: number
  private constructor(start: number, end?: number) {
    invariant(end === undefined || end - start >= 0, 'start must be equal or inferior to end')
    this.start = start
    this.end = typeof end === 'number' ? end : start
  }

  static between(one: number, two: number) {
    return Selection.fromBounds(
      Math.min(one, two),
      Math.max(one, two)
    )
  }

  static fromBounds(start: number, end?: number) {
    return new Selection(start, end)
  }

  static fromObject({ start, end }: { start: number, end: number }) {
    return new Selection(start, end)
  }

  encompasses(charIndex: number): boolean {
    return charIndex >= this.start &&
           charIndex <= this.end
  }

  intersection(selection: Selection) {
    return Selection.fromBounds(
      Math.max(this.start, selection.start),
      Math.min(this.end, selection.end)
    )
  }

  union(selection: Selection) {
    return Selection.fromBounds(
      Math.min(this.start, selection.start),
      Math.max(this.end, selection.end)
    )
  }

  length(): number {
    return this.end - this.start
  }

  selectText(text: string) {
    return text.substring(this.start, this.end)
  }
}
