import { Selection } from './Selection'
import { DocumentDelta } from './DocumentDelta'
import Delta from 'quill-delta'

export class DocumentDeltaAtomicUpdate {
  private readonly _selectionAfterChange: Selection
  public readonly delta: DocumentDelta
  public readonly diff: Delta
  public constructor(delta: DocumentDelta, diff: Delta, selectionAfterChange: Selection) {
    this._selectionAfterChange = selectionAfterChange
    this.delta = delta
    this.diff = diff
  }

  public get selectionAfterChange() {
    return this._selectionAfterChange
  }
}
