import { Observable } from 'rxjs'
import { Selection } from '@delta/Selection'
import { DeltaChangeContext } from '@delta/DeltaChangeContext'

export interface TextChange {
  newText: string
  deltaChangeContext: DeltaChangeContext
}

function mapTextWithSelection([newText, selectionBeforeChange, selectionAfterChange]: [
  string,
  Selection,
  Selection,
]): TextChange {
  return {
    newText,
    deltaChangeContext: new DeltaChangeContext(selectionBeforeChange, selectionAfterChange),
  }
}

export function syncTextUpdates(
  textChanges$: Observable<string>,
  selectionChanges$: Observable<Selection>,
): Observable<TextChange> {}
