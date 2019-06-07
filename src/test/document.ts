// tslint:disable:no-string-literal
import Document from '@model/Document'
import Orchestrator from '@model/Orchestrator'
import Bridge from '@core/Bridge'
import { defaultTextTransforms } from '@delta/transforms'
import TextTransformsRegistry from '@core/TextTransformsRegistry'
import DocumentDelta from '@delta/DocumentDelta'
import { GenericOp } from '@delta/operations'
import TextBlock from '@model/TextBlock'

export function mokBridgeInnerInterface(): Bridge.InnerInterface<any> {
  return {
    addApplyLineTypeToSelectionListener: jest.fn(),
    addApplyTextTransformToSelectionListener: jest.fn(),
    addInsertOrReplaceAtSelectionListener: jest.fn(),
    getTextTransformsReg: () => new TextTransformsRegistry(defaultTextTransforms),
    release: jest.fn(),
    setSelectedLineType: jest.fn(),
    setSelectedTextAttributes: jest.fn()
  }
}

export function mockDocumentDelta(ops?: GenericOp[], controller?: Orchestrator.BlockEmitterInterface): DocumentDelta {
  return new DocumentDelta(controller || { emitToBlockController: () => ({}) }, ops)
}

export function mockDocumentBlockInterface(): Document.BlockInterface<any> {
  const document = new Document()
  const bridgeInnerInterface = mokBridgeInnerInterface()
  document.registerConsumer({
    bridgeInnerInterface,
    handleOnDocumentStateUpdate: () => ({})
  })
  document.insertBlock(TextBlock)
  const block = document.getActiveBlock() as TextBlock<any>
  return {
    bridgeInnerInterface,
    orchestrator: document['orchestrator'],
    getDelta: block.getDelta.bind(block),
    updateDelta: block['updateDelta'].bind(block),
    onPressBackspaceFromOrigin: () => ({}),
    onPressEnter: () => ({})
  }
}
