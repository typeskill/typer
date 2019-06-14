import invariant from 'invariant'

/**
 * A class representing a range of character indexes.
 * This range can represent a selection of those characters.
 *
 */
export class Selection {
  public readonly start: number
  public readonly end: number
  private constructor(start: number, end?: number) {
    invariant(end === undefined || end - start >= 0, 'start must be equal or inferior to end')
    this.start = start
    this.end = typeof end === 'number' ? end : start
  }

  public static between(one: number, two: number) {
    return Selection.fromBounds(Math.min(one, two), Math.max(one, two))
  }

  public static fromBounds(start: number, end?: number) {
    return new Selection(start, end)
  }

  public static fromObject({ start, end }: { start: number; end: number }) {
    return new Selection(start, end)
  }

  /**
   * Informs wether or not an index touches this range.
   *
   * @remarks
   *
   * ```ts
   * const selection = Selection.fromBounds(1, 3)
   * selection.containsIndex(0) // false
   * selection.containsIndex(1) // true
   * selection.containsIndex(2) // true
   * selection.containsIndex(3) // true
   * selection.containsIndex(4) // false
   * ```
   *
   * @param selectionIndex
   */
  public touchesIndex(selectionIndex: number): boolean {
    return selectionIndex >= this.start && selectionIndex <= this.end
  }

  /**
   * Informs wether or not a selection has at least one index in
   * common with another selection.
   *
   * @param selection
   */
  public touchesSelection(selection: Selection): boolean {
    const lowerBound = selection.start
    const upperBound = selection.end
    return this.touchesIndex(lowerBound) || this.touchesIndex(upperBound)
  }

  public intersectionLength(selection: Selection) {
    const intersection = this.intersection(selection)
    return intersection ? intersection.length() : 0
  }

  /**
   *
   * @param selection
   */
  public intersection(selection: Selection): Selection | null {
    const maximumMin = Math.max(this.start, selection.start)
    const minimumMax = Math.min(this.end, selection.end)
    if (maximumMin < minimumMax) {
      return Selection.fromBounds(maximumMin, minimumMax)
    }
    return null
  }

  public length(): number {
    return this.end - this.start
  }
}
