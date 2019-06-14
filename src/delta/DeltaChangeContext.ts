import { Selection } from './Selection'

export class DeltaChangeContext {
  public readonly selectionBeforeChange: Selection
  public readonly selectionAfterChange: Selection

  public constructor(selectionBeforeChange: Selection, selectionAfterChange: Selection) {
    this.selectionAfterChange = selectionAfterChange
    this.selectionBeforeChange = selectionBeforeChange
  }

  public lowerLimit() {
    return Math.min(this.selectionAfterChange.start, this.selectionBeforeChange.start)
  }

  public upperLimit() {
    return Math.max(this.selectionAfterChange.end, this.selectionBeforeChange.end)
  }

  public deleteTraversal(): Selection {
    return Selection.fromBounds(
      Math.min(this.selectionBeforeChange.start, this.selectionAfterChange.start),
      this.selectionBeforeChange.end,
    )
  }

  public isInsertion() {
    return this.selectionBeforeChange.start < this.selectionAfterChange.end
  }

  public isDeletion() {
    return this.selectionBeforeChange.end > this.lowerLimit()
  }
}
