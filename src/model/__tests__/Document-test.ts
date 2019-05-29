// tslint:disable:no-unused-variable
// tslint:disable:no-string-literal
import Document from '@model/Document'
import TextBlock from '@model/TextBlock'
import Bridge from '@core/Bridge'
import { mockDeltaChangeContext } from '@test/delta'
import { getHeadingCharactersFromType } from '@delta/DocumentDelta'

function newConsumer() {
  const bridge = new Bridge<any>()
  return {
    bridgeOuterInterface: bridge.getOuterInterface(),
    bridgeInnerInterface: bridge.getInnerInterface(),
    handleOnDocumentStateUpdate: () => { /** noop */ }
  }
}

function createContext() {
  const consumer = newConsumer()
  const outerInterface = consumer.bridgeOuterInterface
  const document = new Document()
  document.registerConsumer(consumer)
  const block0 = document.getActiveBlock() as TextBlock<any>
  return {
    outerInterface,
    block0
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
      const { outerInterface, block0 } = createContext()
      block0.handleOnTextChange('First\n', mockDeltaChangeContext(0, 5))
      block0.handleOnSelectionChange({ start: 5, end: 5 })
      outerInterface.applyLineTransformToSelection('ol')
      expect(block0.getDelta().ops).toEqual([
        { insert: getHeadingCharactersFromType('ol', 0) + 'First' },
        { insert: '\n', attributes: { $type: 'ol' } }
      ])
    })
    it('applying type to multiple lines and adding newline', () => {
      const { outerInterface, block0 } = createContext()
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
      const { outerInterface, block0 } = createContext()
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
    it('applying text attributes to empty selection should result in cursor attributes matching these attributes', () => {
      const { outerInterface, block0 } = createContext()
      const initialLine = 'F'
      block0.handleOnTextChange(initialLine, mockDeltaChangeContext(0, 1))
      block0.handleOnSelectionChange({ start: 1, end: 1 })
      outerInterface.applyTextTransformToSelection('weight', 'bold')
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: 'bold'
      })
    })
    it('setting cursor attributes should propagate to inserted text', () => {
      const { outerInterface, block0 } = createContext()
      const initialLine = 'F\n'
      const nextLine = 'FP\n'
      block0.handleOnTextChange(initialLine, mockDeltaChangeContext(0, 1))
      block0.handleOnSelectionChange({ start: 1, end: 1 })
      outerInterface.applyTextTransformToSelection('weight', 'bold')
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: 'bold'
      })
      block0.handleOnTextChange(nextLine, mockDeltaChangeContext(1, 2))
      expect(block0.getDelta().ops).toEqual([
        { insert: 'F' },
        { insert: 'P', attributes: { weight: 'bold' } },
        { insert: '\n' }
      ])
    })
    it('unsetting cursor attributes should propagate to inserted text', () => {
      const { outerInterface, block0 } = createContext()
      const initialLine = 'F\n'
      const nextLine = 'FP\n'
      outerInterface.applyTextTransformToSelection('weight', 'bold')
      block0.handleOnTextChange(initialLine, mockDeltaChangeContext(0, 1))
      block0.handleOnSelectionChange({ start: 1, end: 1 })
      outerInterface.applyTextTransformToSelection('weight', null)
      expect(block0.getCursorAttributes()).toMatchObject({
        weight: null
      })
      block0.handleOnTextChange(nextLine, mockDeltaChangeContext(1, 2))
      expect(block0.getDelta().ops).toEqual([
        { insert: 'F', attributes: { weight: 'bold' } },
        { insert: 'P\n' }
      ])
    })
  })
})
