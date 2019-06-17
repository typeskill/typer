// tslint:disable:no-string-literal
import { mockDocumentBlockInterface, mockDocumentDeltaSerialUpdate, runUpdates } from '@test/document'
import { TextBlock } from '@model/TextBlock'
import { mockSelection } from '@test/delta'
import { getHeadingCharactersFromType } from '@delta/lines'

describe('@model/TextBlock', () => {
  describe('handleOnSelectionChange', () => {
    it('should notify of a selected line type update', () => {
      const blockInterface = mockDocumentBlockInterface()
      const textBlock = new TextBlock(blockInterface)
      runUpdates(
        textBlock['transformSerialUpdateToGenerator'](
          mockDocumentDeltaSerialUpdate([
            { insert: 'A\n' },
            { insert: getHeadingCharactersFromType('ul', 0) + 'B' },
            { insert: '\n', attributes: { $type: 'ul' } },
          ]),
        ),
      )
      textBlock.handleOnSelectionChange(mockSelection(0))
      expect(blockInterface.sheetEventDom.notifySelectedLineTypeChange).toHaveBeenCalledWith('normal')
    })
    it('should notify of a selected text attribute update', () => {
      const blockInterface = mockDocumentBlockInterface()
      const textBlock = new TextBlock(blockInterface)
      const serialUpdate = mockDocumentDeltaSerialUpdate([
        { insert: 'A\n' },
        { insert: 'B', attributes: { weight: 'bold' } },
        { insert: '\n' },
      ])
      runUpdates(textBlock['transformSerialUpdateToGenerator'](serialUpdate))
      textBlock.handleOnSelectionChange(mockSelection(3))
      expect(blockInterface.sheetEventDom.notifySelectedTextAttributesChange).toHaveBeenCalledWith({
        weight: 'bold',
      })
    })
  })
})
