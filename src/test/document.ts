import { Bridge } from '@core/Bridge'
import { defaultTextTransforms } from '@core/Transforms'
import { Transforms } from '@core/Transforms'
import { DocumentDelta } from '@delta/DocumentDelta'
import { GenericOp } from '@delta/operations'
import { Selection } from '@delta/Selection'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'

export function mokBridgeSheetEventDomain(): Bridge.SheetEventDomain {
  return {
    addApplyTextTransformToSelectionListener: jest.fn(),
    addInsertOrReplaceAtSelectionListener: jest.fn(),
    getTransforms: () => new Transforms(defaultTextTransforms),
    release: jest.fn(),
    notifySelectedLineTypeChange: jest.fn(),
    notifySelectedTextAttributesChange: jest.fn(),
  }
}

export function mockDocumentDelta(ops?: GenericOp[]): DocumentDelta {
  return new DocumentDelta(ops)
}

export function mockDocumentDeltaAtomicUpdate(ops?: GenericOp[]): DocumentDeltaAtomicUpdate {
  const delta = mockDocumentDelta(ops)
  return new DocumentDeltaAtomicUpdate(delta, Selection.fromBounds(delta.length()))
}
export function runUpdates(iterator: IterableIterator<DocumentDeltaAtomicUpdate>) {
  while (!iterator.next().done) {}
}
