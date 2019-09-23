import invariant from 'invariant'

/**
 * A serializable object representing a selection of items in the {@link (Typer:interface)}.
 *
 * @public
 */
export interface SelectionShape {
  /**
   * **Inclusive** first item index in selection.
   */
  readonly start: number
  /**
   * **Exclusive** last item index in selection.
   */
  readonly end: number
}

/**
 * A class representing a range of character indexes.
 * This range can represent a selection of those characters.
 *
 */
export class Selection implements SelectionShape {
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

  public static fromShape({ start, end }: SelectionShape) {
    return new Selection(start, end)
  }

  /**
   * Informs wether or not an index touches this range.
   *
   * @remarks
   *
   * ```ts
   * const selection = Selection.fromBounds(1, 3)
   * selection.touchesIndex(0) // false
   * selection.touchesIndex(1) // true
   * selection.touchesIndex(2) // true
   * selection.touchesIndex(3) // true
   * selection.touchesIndex(4) // false
   * ```
   *
   * @param selectionIndex - The index to test.
   */
  public touchesIndex(selectionIndex: number): boolean {
    return selectionIndex >= this.start && selectionIndex <= this.end
  }

  /**
   * Informs wether or not a selection has at least one index in
   * common with another selection.
   *
   * @param selection - The selection to which this test should apply.
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
   * @param selection - The selection to which this test should apply.
   */
  public intersection(selection: Selection): Selection | null {
    const maximumMin = Math.max(this.start, selection.start)
    const minimumMax = Math.min(this.end, selection.end)
    if (maximumMin < minimumMax) {
      return Selection.fromBounds(maximumMin, minimumMax)
    }
    return null
  }

  public move(position: number): SelectionShape {
    const { start, end } = this
    return {
      start: start + position,
      end: end + position,
    }
  }

  public toShape(): SelectionShape {
    const { start, end } = this
    return {
      start,
      end,
    }
  }

  public length(): number {
    return this.end - this.start
  }
}
