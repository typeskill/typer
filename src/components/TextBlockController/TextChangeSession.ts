import { DeltaChangeContext } from '@delta/DocumentDelta'
import { Selection } from '@delta/selection'

export class TextChangeSession {

  private selectionBeforeChange: Selection|null = null
  private selectionAfterChange: Selection|null = null
  private textAfterChange: string|null = null

  public getDeltaChangeContext(): DeltaChangeContext {
    if (this.selectionAfterChange === null) {
      throw new Error('selectionAfterChange must be set before getting delta change context.')
    }
    if (this.selectionBeforeChange === null) {
      throw new Error('selectionBeforeChange must be set before getting delta change context.')
    }
    return {
      selectionAfterChange: this.selectionAfterChange,
      selectionBeforeChange: this.selectionBeforeChange
    }
  }

  public setTextAfterChange(textAfterChange: string) {
    this.textAfterChange = textAfterChange
  }

  public setSelectionBeforeChange(selectionBeforeChange: Selection) {
    this.selectionBeforeChange = selectionBeforeChange
  }

  public setSelectionAfterChange(selectionAfterChange: Selection) {
    this.selectionAfterChange = selectionAfterChange
  }

  public getTextAfterChange() {
    if (this.textAfterChange === null) {
      throw new Error('textAfterChange is not set.')
    }
    return this.textAfterChange
  }
}
