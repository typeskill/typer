import { DocumentContent, applyTextTransformToSelection } from '@model/document'
import { Selection } from '@delta/Selection'
import mergeLeft from 'ramda/es/mergeLeft'

describe('@model/document', () => {
  describe('applyTextTransformToSelection', () => {
    it('applying text attributes to empty selection should result in cursor attributes matching these attributes', () => {
      const documentContent: DocumentContent = {
        currentSelection: Selection.fromBounds(1),
        ops: [{ insert: 'F' }],
        selectedTextAttributes: {},
        textAttributesAtCursor: {},
      }
      const diff = applyTextTransformToSelection('weight', 'bold', documentContent)
      expect(diff.textAttributesAtCursor).toMatchObject({
        weight: 'bold',
      })
      expect(diff.selectedTextAttributes).toMatchObject({
        weight: 'bold',
      })
    })
    it('successively applying text attributes to empty selection should result in the merging of those textAttributesAtCursor', () => {
      const documentContent1: DocumentContent = {
        currentSelection: Selection.fromBounds(1),
        ops: [{ insert: 'F' }],
        selectedTextAttributes: {},
        textAttributesAtCursor: {},
      }
      const diff1 = applyTextTransformToSelection('weight', 'bold', documentContent1)
      const documentContent2 = mergeLeft(diff1, documentContent1)
      const diff2 = applyTextTransformToSelection('italic', true, documentContent2)
      expect(diff2.textAttributesAtCursor).toMatchObject({
        weight: 'bold',
        italic: true,
      })
    })
    it('setting cursor attributes should apply to inserted text', () => {
      const documentContent1: DocumentContent = {
        currentSelection: Selection.fromBounds(1, 2),
        ops: [{ insert: 'FP\n' }],
        selectedTextAttributes: {},
        textAttributesAtCursor: {},
      }
      const diff = applyTextTransformToSelection('weight', 'bold', documentContent1)
      expect(diff).toMatchObject({
        ops: [{ insert: 'F' }, { insert: 'P', attributes: { weight: 'bold' } }, { insert: '\n' }],
        selectedTextAttributes: { weight: 'bold' },
        textAttributesAtCursor: { weight: 'bold' },
      })
    })
    it('unsetting cursor attributes should propagate to inserted text', () => {
      const documentContent1: DocumentContent = {
        currentSelection: Selection.fromBounds(1, 2),
        ops: [{ insert: 'F' }, { insert: 'P', attributes: { weight: 'bold' } }, { insert: '\n' }],
        selectedTextAttributes: { weight: 'bold' },
        textAttributesAtCursor: { weight: 'bold' },
      }
      const diff = applyTextTransformToSelection('weight', null, documentContent1)
      expect(diff).toMatchObject({
        ops: [{ insert: 'FP\n' }],
        selectedTextAttributes: {},
        textAttributesAtCursor: {
          weight: null,
        },
      })
    })
  })
})
