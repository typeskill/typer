import Document from '@model/Document'
import TextBlock from '@model/TextBlock'
import Bridge from '@core/Bridge'
import { mockDeltaChangeContext } from 'test/delta'
import { getHeadingCharactersFromType, extractTextFromDelta } from '@delta/DocumentDelta';

function newConsumer() {
  const bridge = new Bridge<any>()
  return {
    bridgeOuterInterface: bridge.getOuterInterface(),
    bridgeInnerInterface: bridge.getInnerInterface(),
    handleOnDocumentStateUpdate: () => { /** noop */ }
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
    it('setting a line to ol type should add prefix', () => {
      const consumer = newConsumer()
      const outerInterface = consumer.bridgeOuterInterface
      const document = new Document()
      document.registerConsumer(consumer)
      const block0 = document.getActiveBlock() as TextBlock<any>
      block0.handleOnTextChange('First\n', mockDeltaChangeContext(0, 5))
      block0.handleOnSelectionChange({ start: 5, end: 5 })
      outerInterface.applyLineTransformToSelection('ol')
      expect(block0.getDelta().ops).toEqual([
        { insert: getHeadingCharactersFromType('ol', 0) + 'First' },
        { insert: '\n', attributes: { $type: 'ol' } }
      ])
    })
    it('applying type to multiple lines and adding newline', () => {
      const consumer = newConsumer()
      const outerInterface = consumer.bridgeOuterInterface
      const document = new Document()
      document.registerConsumer(consumer)
      const block0 = document.getActiveBlock() as TextBlock<any>
      const firstLine = getHeadingCharactersFromType('ol', 0) + 'First'
      const fullText = firstLine + '\n'
      block0.handleOnTextChange(fullText, mockDeltaChangeContext(0, fullText.length - 1))
      block0.handleOnSelectionChange({ start: firstLine.length - 1, end: firstLine.length - 1 })
      outerInterface.applyLineTransformToSelection('ol')
      block0.handleOnTextChange(fullText, mockDeltaChangeContext(fullText.length - 1, fullText.length))
      expect(block0.getDelta().ops).toEqual([
        { insert: getHeadingCharactersFromType('ol', 0) + 'First' },
        { insert: '\n', attributes: { $type: 'ol' } },
        { insert: getHeadingCharactersFromType('ol', 1) },
        { insert: '\n', attributes: { $type: 'ol' } }
      ])
    })
    it('deleting an ol prefix manually should remove ol type', () => {
      const consumer = newConsumer()
      const outerInterface = consumer.bridgeOuterInterface
      const document = new Document()
      document.registerConsumer(consumer)
      const block0 = document.getActiveBlock() as TextBlock<any>
      const initialLine = 'First\n'
      block0.handleOnTextChange(initialLine, mockDeltaChangeContext(0, 5))
      block0.handleOnSelectionChange({ start: 5, end: 5 })
      outerInterface.applyLineTransformToSelection('ol')
      const header = getHeadingCharactersFromType('ol', 0)
      const transformedLine = header + 'First'
      const slicedLine = header.slice(0, 1) + header.slice(2) + initialLine
      expect(block0.getDelta().ops).toEqual([
        { insert: transformedLine },
        { insert: '\n', attributes: { $type: 'ol' } }
      ])
      block0.handleOnSelectionChange({ start: 2, end: 2 })
      block0.handleOnTextChange(slicedLine, mockDeltaChangeContext(2, 1))
      expect(block0.getDelta().ops).toEqual([
        { insert: initialLine }
      ])
    })
  })
})
