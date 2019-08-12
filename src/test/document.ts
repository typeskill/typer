import { Document } from '@model/Document'
import { Bridge } from '@core/Bridge'
import { defaultTextTransforms } from '@core/Transforms'
import { Transforms } from '@core/Transforms'
import { DocumentDelta } from '@delta/DocumentDelta'
import { GenericOp } from '@delta/operations'
import { TextBlock } from '@model/TextBlock'
import { DocumentDeltaSerialUpdate } from '@delta/DocumentDeltaSerialUpdate'
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

export function mockDocumentDeltaSerialUpdate(ops?: GenericOp[]): DocumentDeltaSerialUpdate {
  const delta = mockDocumentDelta(ops)
  return new DocumentDeltaSerialUpdate(delta, Selection.fromBounds(delta.length()))
}

export function mockDocumentBlockInterface(): Document.BlockInterface {
  const document = new Document()
  const sheetEventDom = mokBridgeSheetEventDomain()
  document.registerConsumer({
    sheetEventDom,
    handleOnDocumentStateUpdate: () => ({}),
  })
  document.insertBlock(TextBlock)
  return {
    sheetEventDom,
    orchestrator: document['orchestrator'],
    onPressBackspaceFromOrigin: () => ({}),
    onPressEnter: () => ({}),
  }
}

export function runUpdates(iterator: IterableIterator<DocumentDeltaAtomicUpdate>) {
  while (!iterator.next().done) {}
}
