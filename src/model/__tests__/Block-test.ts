import { buildEmptyDocument, Document } from '@model/document'
import { buildTextOp, GenericOp } from '@delta/operations'
import { groupOpsByBlocks } from '@model/blocks'
import { buildDummyImageOp } from '@test/document'

describe('@model/Block', () => {
  function buildDocContentWithSel(start: number, end: number, ops?: GenericOp[]): Document {
    const obj = {
      ...buildEmptyDocument(),
      currentSelection: { start, end },
    }
    return ops ? { ...obj, ops } : obj
  }
  function createContext(start: number, end: number, ops: GenericOp[]) {
    const doc: Document = buildDocContentWithSel(start, end, ops)
    const blocks = groupOpsByBlocks(ops)
    return {
      doc,
      blocks,
    }
  }
  describe('isFocused', () => {
    it('should return true when active area matches block', () => {
      const { blocks, doc } = createContext(0, 3, [buildTextOp('Hel')])
      expect(blocks.length).toBe(1)
      const block = blocks[0]
      expect(block.isFocused(doc)).toBe(true)
    })
    it('should return false when active area overflows block', () => {
      const { blocks, doc } = createContext(0, 4, [buildTextOp('Hel')])
      expect(blocks.length).toBe(1)
      const block = blocks[0]
      expect(block.isFocused(doc)).toBe(false)
    })
    it('should return false when active area is outside of block', () => {
      const { blocks, doc } = createContext(3, 4, [buildTextOp('Hel')])
      expect(blocks.length).toBe(1)
      const block = blocks[0]
      expect(block.isFocused(doc)).toBe(false)
    })
    it('should return false when selection is of length 0, touching the end of this block and the next block', () => {
      const ops = [buildDummyImageOp(), buildTextOp('Hel\n')]
      const { blocks, doc } = createContext(1, 1, ops)
      expect(blocks.length).toBe(2)
      const textBlock = blocks[1]
      const imageBlock = blocks[0]
      expect(textBlock.isFocused(doc)).toBe(true)
      expect(imageBlock.isFocused(doc)).toBe(false)
    })
  })
  describe('updateTextAttributesAtSelection', () => {
    it('should update text attributes', () => {
      const ops = [buildTextOp('Y', { bold: true }), buildTextOp('\n')]
      const { blocks, doc } = createContext(0, 1, ops)
      expect(blocks.length).toBe(1)
      const textBlock = blocks[0]
      expect(textBlock.updateTextAttributesAtSelection(doc).selectedTextAttributes).toMatchObject({
        bold: true,
      })
    })
  })
  describe('applyTextTransformToSelection', () => {
    it('should apply transform to a selection encompassing a text block', () => {
      const ops = [buildTextOp('Lol\n')]
      const { blocks, doc } = createContext(0, 3, ops)
      expect(blocks.length).toBe(1)
      const textBlock = blocks[0]
      expect(textBlock.applyTextTransformToSelection('bold', true, doc).ops).toMatchObject([
        buildTextOp('Lol', { bold: true }),
        buildTextOp('\n'),
      ])
    })
    it('should not apply transform to a selection encompassing a non-text block', () => {
      const ops = [buildTextOp('Lol'), buildDummyImageOp(), buildTextOp('\n')]
      const { blocks, doc } = createContext(3, 4, ops)
      expect(blocks.length).toBe(3)
      const imageBlock = blocks[1]
      expect(imageBlock.applyTextTransformToSelection('bold', true, doc).ops).toMatchObject(ops)
    })
  })
  describe('getScopedSelection', () => {
    it('should return a selection which is relative to the block coordinates', () => {
      const ops = [buildTextOp('Lol'), buildDummyImageOp(), buildTextOp('\n')]
      const { blocks, doc } = createContext(3, 4, ops)
      expect(blocks.length).toBe(3)
      const imageBlock = blocks[1]
      expect(imageBlock.getBlockScopedSelection(doc)).toMatchObject({ start: 0, end: 1 })
    })
  })
  describe('getSelectedOps', () => {
    it('should return ops which are selected in document', () => {
      const ops = [buildTextOp('Lol'), buildDummyImageOp(), buildTextOp('\n')]
      const { blocks, doc } = createContext(3, 4, ops)
      expect(blocks.length).toBe(3)
      const imageBlock = blocks[1]
      expect(imageBlock.getSelectedOps(doc)).toMatchObject([buildDummyImageOp()])
    })
  })
  describe('isEntirelySelected', () => {
    it('should return true when the current selection exactly matches the block boundaries', () => {
      const ops = [buildTextOp('Lol'), buildDummyImageOp(), buildTextOp('\n')]
      const { blocks, doc } = createContext(3, 4, ops)
      expect(blocks.length).toBe(3)
      const imageBlock = blocks[1]
      expect(imageBlock.isEntirelySelected(doc)).toBe(true)
    })
    it('should return false when the current selection partly matches the block boundaries', () => {
      const ops = [buildTextOp('Lol'), buildDummyImageOp(), buildTextOp('\n')]
      const { blocks, doc } = createContext(4, 4, ops)
      expect(blocks.length).toBe(3)
      const imageBlock = blocks[1]
      expect(imageBlock.isEntirelySelected(doc)).toBe(false)
    })
  })
  describe('insertOrReplaceAtSelection', () => {
    it('should replace when selection length is more then 0', () => {
      const ops = [buildTextOp('Lol'), buildDummyImageOp(), buildTextOp('\n')]
      const { blocks, doc } = createContext(3, 4, ops)
      expect(blocks.length).toBe(3)
      const imageBlock = blocks[1]
      expect(imageBlock.insertOrReplaceAtSelection({ type: 'text', content: 'L' }, doc).ops).toMatchObject([
        buildTextOp('LolL\n'),
      ])
    })
  })
  describe('remove', () => {
    it('should remove the whole block when not the first block', () => {
      const ops = [buildTextOp('Lol'), buildDummyImageOp(), buildTextOp('\n')]
      const { blocks, doc } = createContext(3, 4, ops)
      expect(blocks.length).toBe(3)
      const imageBlock = blocks[1]
      expect(imageBlock.remove(doc).ops).toMatchObject([buildTextOp('Lol\n')])
    })
    it('should replace the block with a default block when the only block', () => {
      const ops = [buildTextOp('L\n')]
      const { blocks, doc } = createContext(0, 2, ops)
      expect(blocks.length).toBe(1)
      const textBlock = blocks[0]
      expect(textBlock.remove(doc).ops).toMatchObject([buildTextOp('\n')])
    })
  })
})
