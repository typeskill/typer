import { Selection } from './Selection'
import { DocumentDelta } from './DocumentDelta'
import { DocumentDeltaAtomicUpdate } from './DocumentDeltaAtomicUpdate'

/**
 * This class encapsulate the information necessary to perform
 * a graphic update.
 */
export class DocumentDeltaSerialUpdate {
  public readonly intermediaryUpdate: DocumentDeltaAtomicUpdate | null = null
  public readonly finalUpdate: DocumentDeltaAtomicUpdate

  public constructor(
    afterApplyTextDiffDelta: DocumentDelta,
    selectionAfterChange: Selection,
    overridingSelection?: Selection,
  ) {
    this.finalUpdate = new DocumentDeltaAtomicUpdate(afterApplyTextDiffDelta, selectionAfterChange, overridingSelection)
  }

  public get intermediaryDelta(): DocumentDelta | null {
    return this.intermediaryUpdate && this.intermediaryUpdate.delta
  }

  public get finalDelta(): DocumentDelta {
    return this.finalUpdate.delta
  }

  public get finalOverridingSelection(): Selection | null {
    return this.finalUpdate.selectionAfterChange
  }

  public get intermediaryOverridingSelection(): Selection | null {
    return this.intermediaryUpdate && this.intermediaryUpdate.selectionAfterChange
  }

  public getSelectedTextAttributes(selection: Selection) {
    return this.finalDelta.getSelectedTextAttributes(selection)
  }

  public getLineTypeInSelection(selection: Selection) {
    return this.finalDelta.getLineTypeInSelection(selection)
  }

  public hasIntermediaryUpdate() {
    return !!this.intermediaryUpdate
  }
}
