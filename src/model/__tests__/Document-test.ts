import Document from '@model/Document'
import TextBlock from '@model/TextBlock'
import Bridge from '@core/Bridge'

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
    it('should pass scenari 1: alternating between two blocks', () => {
      const document = new Document()
      document.registerConsumer(newConsumer())
      let block0 = document.getActiveBlock() as TextBlock<any>
      block0.handleOnTextChange('First line')
      block0.handleOnSubmitEditing() // return new line
      let block1 = document.getActiveBlock()
      block1.handleOnKeyPress('Backspace')
      block0 = document.getActiveBlock() as TextBlock<any>
      block0.handleOnSubmitEditing()
      block1 = document.getActiveBlock()
      block1.handleOnKeyPress('Backspace')
      expect(document.getActiveBlock().getDelta().ops).toEqual([
        { insert: 'First line\n' }
      ])
    })
    it('should pass scenari 2: applying type to multiple lines and adding newline', () => {
      const consumer = newConsumer()
      const outerInterface = consumer.bridgeOuterInterface
      const document = new Document()
      document.registerConsumer(consumer)
      const block0 = document.getActiveBlock() as TextBlock<any>
      block0.handleOnTextChange('First\nSecond')
      block0.handleOnSelectionChange({ start: 0, end: 12 })
      outerInterface.applyLineTransformToSelection('ol')
      block0.handleOnTextChange('First\nSecond\n')
      expect(block0.getDelta().ops).toEqual([
        { insert: 'First' },
        { insert: '\n', attributes: { $type: 'ol' } },
        { insert: 'Second' },
        { insert: '\n', attributes: { $type: 'ol' } }
      ])
    })
    it('should pass scenari 3: deleting an ol prefix manually should remove ol type', () => {
      const consumer = newConsumer()
      const outerInterface = consumer.bridgeOuterInterface
      const document = new Document()
      document.registerConsumer(consumer)
      const block0 = document.getActiveBlock() as TextBlock<any>
      block0.handleOnTextChange('First')
      block0.handleOnSelectionChange({ start: 0, end: 5 })
      outerInterface.applyLineTransformToSelection('ol')
      expect(block0.getDelta().ops).toEqual([
        { insert: 'First' },
        { insert: '\n', attributes: { $type: 'ol' } }
      ])
    })
  })
})
