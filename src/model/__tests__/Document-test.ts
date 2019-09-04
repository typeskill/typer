import { Document } from '@model/Document'
import { buildInitialDocContent, DocumentContent } from '@model/documents'
import { buildTextOp, buildImageOp } from '@delta/operations'

describe('@model/Document', () => {
  describe('updateTextAttributesAtSelection', () => {
    it('should not update attributes when selection matches a non-text block', () => {
      const docContent: DocumentContent = {
        ...buildInitialDocContent(),
        ops: [buildTextOp('L'), buildImageOp({ test: 'one' })],
        currentSelection: {
          start: 2,
          end: 2,
        },
      }
      const doc = new Document(docContent)
      expect(doc.updateTextAttributesAtSelection().selectedTextAttributes).toMatchObject({})
    })
  })
})
