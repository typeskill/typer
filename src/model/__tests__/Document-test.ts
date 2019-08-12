/* eslint-disable @typescript-eslint/no-unused-vars */
import { Document } from '@model/Document'
import { TextBlock } from '@model/TextBlock'
import { Bridge } from '@core/Bridge'
import { mockDeltaChangeContext, mockSelection } from '@test/delta'
import { Selection } from '@delta/Selection'
import { mockDocumentDelta, mockDocumentDeltaSerialUpdate, runUpdates } from '@test/document'

function newConsumer() {
  const bridge = new Bridge()
  return {
    controlEventDom: bridge.getControlEventDomain(),
    sheetEventDom: bridge.getSheetEventDomain(),
    handleOnDocumentStateUpdate: () => {
      /** noop */
    },
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
  describe('document operations', () => {
    it('applying text attributes to empty selection should result in cursor attributes matching these attributes', () => {
      const { controlEventDom, block0 } = createContext()
      const initialLine = 'F'
      block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, 1))
      block0.handleOnSelectionChange(Selection.fromBounds(1))
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: 'bold',
      })
    })
    it('successively applying text attributes to empty selection should result in the merging of those attributes', () => {
      const { controlEventDom, block0 } = createContext()
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      controlEventDom.applyTextTransformToSelection('italic', true)
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: 'bold',
        italic: true,
      })
    })
    it('setting cursor attributes should propagate to inserted text', () => {
      const { controlEventDom, block0 } = createContext()
      const initialLine = 'F\n'
      const nextLine = 'FP\n'
      runUpdates(block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, 1)))
      block0.handleOnSelectionChange(Selection.fromBounds(1))
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: 'bold',
      })
      runUpdates(block0.createSerialUpdateGenerator(nextLine, mockDeltaChangeContext(1, 2)))
      expect(block0.getDelta().ops).toEqual([
        { insert: 'F' },
        { insert: 'P', attributes: { weight: 'bold' } },
        { insert: '\n' },
      ])
    })
    it('unsetting cursor attributes should propagate to inserted text', () => {
      const { controlEventDom, block0 } = createContext()
      const initialLine = 'F\n'
      const nextLine = 'FP\n'
      controlEventDom.applyTextTransformToSelection('weight', 'bold')
      runUpdates(block0.createSerialUpdateGenerator(initialLine, mockDeltaChangeContext(0, 1)))
      block0.handleOnSelectionChange(Selection.fromBounds(1))
      controlEventDom.applyTextTransformToSelection('weight', null)
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: null,
      })
      runUpdates(block0.createSerialUpdateGenerator(nextLine, mockDeltaChangeContext(1, 2)))
      expect(block0.getDelta().ops).toEqual([{ insert: 'F', attributes: { weight: 'bold' } }, { insert: 'P\n' }])
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
