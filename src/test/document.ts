import Document from '@model/Document'
import Orchestrator from '@model/Orchestrator'
import Bridge from '@core/Bridge'
import { defaultTextTransforms } from '@delta/transforms'
import TextTransformsRegistry from '@core/TextTransformsRegistry'
import DocumentDelta from '@delta/DocumentDelta'

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

export function mockDocumentBlockInterface(): Document.BlockInterface<any> {
  let delta = new DocumentDelta()
  const bridgeInnerInterface = mokBridgeInnerInterface()
  return {
    bridgeInnerInterface,
    getDelta: () => delta,
    orchestrator: new Orchestrator(),
    updateDelta: (d: DocumentDelta) => delta = d,
    onPressBackspaceFromOrigin: () => ({}),
    onPressEnter: () => ({})
  }
}
