import { BlockAssembler } from '@model/BlockAssembler'
import { buildInitialDocContent, Document } from '@model/document'
import { buildTextOp } from '@delta/operations'
import { buildDummyImageOp } from '@test/document'

describe('@model/Document', () => {
  describe('updateTextAttributesAtSelection', () => {
    it('should not update attributes when selection matches a non-text block', () => {
      const document: Document = {
        ...buildInitialDocContent(),
        ops: [buildTextOp('L'), buildDummyImageOp()],
        currentSelection: {
          start: 2,
          end: 2,
        },
      }
      const assembler = new BlockAssembler(document)
      expect(assembler.updateTextAttributesAtSelection().selectedTextAttributes).toMatchObject({})
    })
  })
})
