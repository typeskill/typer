import { Document } from '@model/Document'
import { Bridge } from '@core/Bridge'
import { defaultTextTransforms } from '@core/Transforms'
import { Transforms } from '@core/Transforms'
import { DocumentDelta } from '@delta/DocumentDelta'
import { GenericOp } from '@delta/operations'
import { TextBlock } from '@model/TextBlock'
import { DocumentDeltaUpdate } from '@delta/DocumentDeltaUpdate'

export function mokBridgeSheetEventDomain(): Bridge.SheetEventDomain {
  return {
    addSwitchLineTypeInSelectionListener: jest.fn(),
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

export function mockDocumentDeltaUpdate(ops?: GenericOp[]): DocumentDeltaUpdate {
  return new DocumentDeltaUpdate(mockDocumentDelta(ops))
}

export function mockDocumentBlockInterface(): Document.BlockInterface {
  const document = new Document()
  const sheetEventDom = mokBridgeSheetEventDomain()
  document.registerConsumer({
    sheetEventDom,
    handleOnDocumentStateUpdate: () => ({}),
  })
  document.insertBlock(TextBlock)
  const block = document.getActiveBlock() as TextBlock
  return {
    sheetEventDom,
    orchestrator: document['orchestrator'],
    getDelta: block.getDelta.bind(block),
    updateDelta: block['updateDelta'].bind(block),
    onPressBackspaceFromOrigin: () => ({}),
    onPressEnter: () => ({}),
  }
}
