import { Bridge } from '@core/Bridge'
import { DocumentDelta } from '@delta/DocumentDelta'
import { GenericOp } from '@delta/operations'
import { Selection } from '@delta/Selection'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'
import Delta from 'quill-delta'

export function mokBridgeSheetEventDomain(): Bridge.SheetEventDomain {
  return {
    addApplyTextTransformToSelectionListener: jest.fn(),
    addInsertOrReplaceAtSelectionListener: jest.fn(),
    release: jest.fn(),
  }
}

export function mockDocumentDelta(ops?: GenericOp[]): DocumentDelta {
  return new DocumentDelta(ops)
}

export function mockDocumentDeltaAtomicUpdate(ops?: GenericOp[]): DocumentDeltaAtomicUpdate {
  const delta = mockDocumentDelta(ops)
  // TODO Change second argument (diff)
  return new DocumentDeltaAtomicUpdate(delta, new Delta(), Selection.fromBounds(delta.length()))
}
export function runUpdates(iterator: IterableIterator<DocumentDeltaAtomicUpdate>) {
  while (!iterator.next().done) {}
}
