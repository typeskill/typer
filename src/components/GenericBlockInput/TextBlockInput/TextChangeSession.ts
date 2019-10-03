import { Selection, SelectionShape } from '@delta/Selection'
import { DeltaChangeContext } from '@delta/DeltaChangeContext'

export class TextChangeSession {
  private selectionBeforeChange: SelectionShape | null = null
  private selectionAfterChange: SelectionShape | null = null
  private textAfterChange: string | null = null

  public getDeltaChangeContext(): DeltaChangeContext {
    if (this.selectionAfterChange === null) {
      throw new Error('selectionAfterChange must be set before getting delta change context.')
    }
    if (this.selectionBeforeChange === null) {
      throw new Error('selectionBeforeChange must be set before getting delta change context.')
    }
    return new DeltaChangeContext(
      Selection.fromShape(this.selectionBeforeChange),
      Selection.fromShape(this.selectionAfterChange),
    )
  }

  public setTextAfterChange(textAfterChange: string) {
    this.textAfterChange = textAfterChange
  }

  public setSelectionBeforeChange(selectionBeforeChange: SelectionShape) {
    this.selectionBeforeChange = selectionBeforeChange
  }

  public setSelectionAfterChange(selectionAfterChange: SelectionShape) {
    this.selectionAfterChange = selectionAfterChange
  }

  public getTextAfterChange() {
    if (this.textAfterChange === null) {
      throw new Error('textAfterChange is not set.')
    }
    return this.textAfterChange
  }
}
