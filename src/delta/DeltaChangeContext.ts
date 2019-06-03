import { Selection } from './Selection'
import Text from './Text'

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

  union(): Selection {
    return this.selectionBeforeChange.union(this.selectionAfterChange)
  }

  deleteTraversal(): Selection {
    return Selection.fromBounds(Math.min(this.selectionBeforeChange.start, this.selectionAfterChange.start), this.selectionBeforeChange.end)
  }

  couldBeSuggestion(newText: Text) {
    return this.selectionAfterChange.length() === 0 &&
           this.selectionBeforeChange.length() === 0 &&
           newText.select(this.union()).raw.indexOf('\n') < 0

  }

  isInsertion() {
    return this.selectionBeforeChange.start < this.selectionAfterChange.end
  }

  isDeletion() {
    return this.selectionBeforeChange.end > this.lowerLimit()
  }
}
