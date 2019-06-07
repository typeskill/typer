import { Selection } from './Selection'

export class DeltaChangeContext {
  public readonly selectionBeforeChange: Selection
  public readonly selectionAfterChange: Selection

  constructor(selectionBeforeChange: Selection, selectionAfterChange: Selection) {
    this.selectionAfterChange = selectionAfterChange
    this.selectionBeforeChange = selectionBeforeChange
  }

  lowerLimit() {
    return Math.min(this.selectionAfterChange.start, this.selectionBeforeChange.start)
  }

  upperLimit() {
    return Math.max(this.selectionAfterChange.end, this.selectionBeforeChange.end)
  }

  deleteTraversal(): Selection {
    return Selection.fromBounds(Math.min(this.selectionBeforeChange.start, this.selectionAfterChange.start), this.selectionBeforeChange.end)
  }

  isInsertion() {
    return this.selectionBeforeChange.start < this.selectionAfterChange.end
  }

  isDeletion() {
    return this.selectionBeforeChange.end > this.lowerLimit()
  }
}
