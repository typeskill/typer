// tslint:disable:no-string-literal
import { mockDocumentBlockInterface, mockDocumentDelta } from '@test/document'
import TextBlock from '@model/TextBlock'
import { mockSelection } from '@test/delta'
import DocumentDelta from '@delta/DocumentDelta'
import { getHeadingCharactersFromType } from '@delta/lines'

describe('@model/TextBlock', () => {
  describe('handleOnSelectionChange', () => {
    it('should notify of a selected line type update', () => {
      const blockInterface = mockDocumentBlockInterface()
      const textBlock = new TextBlock(blockInterface)
      textBlock['updateDelta'](mockDocumentDelta([
        { insert: 'A\n' },
        { insert: getHeadingCharactersFromType('ul', 0) + 'B' },
        { insert: '\n', attributes: { $type: 'ul' } }
      ]))
      textBlock.handleOnSelectionChange(mockSelection(0))
      expect(blockInterface.bridgeInnerInterface.setSelectedLineType).toHaveBeenCalledWith('normal')
    })
    it('should notify of a selected text attribute update', () => {
      const blockInterface = mockDocumentBlockInterface()
      const textBlock = new TextBlock(blockInterface)
      textBlock['updateDelta'](mockDocumentDelta([
        { insert: 'A\n' },
        { insert: 'B', attributes: { weight: 'bold' } },
        { insert: '\n' }
      ]))
      textBlock.handleOnSelectionChange(mockSelection(3))
      expect(blockInterface.bridgeInnerInterface.setSelectedTextAttributes).toHaveBeenCalledWith({ weight: 'bold' })
    })
  })
})
