import { Selection } from './Selection'
import { DocumentDelta } from './DocumentDelta'

export class DocumentDeltaAtomicUpdate {
  public readonly delta: DocumentDelta
  private readonly _selectionAfterChange: Selection
  public readonly overridingSelection: Selection | null

  public constructor(delta: DocumentDelta, selectionAfterChange: Selection, overridingSelection?: Selection) {
    this.delta = delta
    this._selectionAfterChange = selectionAfterChange
    this.overridingSelection = overridingSelection || null
  }

  public get selectionAfterChange() {
    return this.overridingSelection || this._selectionAfterChange
  }
}
