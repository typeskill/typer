// tslint:disable:no-string-literal
import { Document } from '@model/Document'
import { Bridge } from '@core/Bridge'
import { defaultTextTransforms } from '@core/transforms'
import { TextTransformsRegistry } from '@core/TextTransformsRegistry'
import { DocumentDelta } from '@delta/DocumentDelta'
import { GenericOp } from '@delta/operations'
import { TextBlock } from '@model/TextBlock'
import { DocumentDeltaUpdate } from '@delta/DocumentDeltaUpdate'

export function mokBridgeInnerInterface(): Bridge.InnerInterface {
  return {
    addApplyLineTypeToSelectionListener: jest.fn(),
    addApplyTextTransformToSelectionListener: jest.fn(),
    addInsertOrReplaceAtSelectionListener: jest.fn(),
    getTextTransformsReg: () => new TextTransformsRegistry(defaultTextTransforms),
    release: jest.fn(),
    setSelectedLineType: jest.fn(),
    setSelectedTextAttributes: jest.fn(),
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
  const bridgeInnerInterface = mokBridgeInnerInterface()
  document.registerConsumer({
    bridgeInnerInterface,
    handleOnDocumentStateUpdate: () => ({}),
  })
  document.insertBlock(TextBlock)
  const block = document.getActiveBlock() as TextBlock
  return {
    bridgeInnerInterface,
    orchestrator: document['orchestrator'],
    getDelta: block.getDelta.bind(block),
    updateDelta: block['updateDelta'].bind(block),
    onPressBackspaceFromOrigin: () => ({}),
    onPressEnter: () => ({}),
  }
}
