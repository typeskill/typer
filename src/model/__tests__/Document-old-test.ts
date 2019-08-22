/* eslint-disable @typescript-eslint/no-unused-vars */
import { TextBlock } from '@model/TextBlock'
import { Bridge, dummyImageLocator } from '@core/Bridge'
import { mockDeltaChangeContext, mockSelection } from '@test/delta'
import { Selection } from '@delta/Selection'
import { runUpdates } from '@test/document'

function newConsumer(): Document.Consumer & { controlEventDom: Bridge.ControlEventDomain<any> } {
  const bridge = new Bridge()
  return {
    controlEventDom: bridge.getControlEventDomain(),
    sheetEventDom: bridge.getSheetEventDomain(),
    handleOnDocumentStateUpdate: () => {
      /** noop */
    },
    imageLocationService: dummyImageLocator,
  }
}

function createContext() {
  const consumer = newConsumer()
  const controlEventDom = consumer.controlEventDom
  const document = new Document()
  document.registerConsumer(consumer)
  const block0 = document.getActiveBlock() as TextBlock
  return {
    controlEventDom,
    block0,
    getOverridingSelection: () => block0.getSelection(),
  }
}

describe('@model/Document', () => {
  describe('constructor', () => {
    it('should no crash at instanciation', () => {
      expect(() => {
        const doc = new Document()
      }).not.toThrow()
    })
  })
  describe('regressions', () => {
    it('pass regression: deleting a newline character should not delete the full upcoming line ', () => {
      const { block0 } = createContext()
      const initialLine = 'F\nG\n'
      const nextLine = 'FG\n'
      runUpdates(block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, 3)))
      block0.handleOnSelectionChange(Selection.fromBounds(2))
      runUpdates(block0.createSerialUpdateGenerator(nextLine, mockDeltaChangeContext(2, 1)))
      expect(block0.getDelta().ops).toEqual([{ insert: 'FG\n' }])
    })
    it('pass regression: unapplying bold followed by applying italic to zero length cursor result in italic attribute for cursor', () => {
      const { controlEventDom, block0 } = createContext()
      const text = 'foo'
      block0.createSerialUpdateGenerator(text, mockDeltaChangeContext(0, 3))
      block0.handleOnSelectionChange(mockSelection(0, 3))
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      block0.handleOnSelectionChange(mockSelection(3))
      controlEventDom.applyTextTransformToSelection('weight', null)
      controlEventDom.applyTextTransformToSelection('italic', true)
      expect(block0.getCursorAttributes()).toEqual({
        italic: true,
        weight: null,
      })
    })
  })
})
