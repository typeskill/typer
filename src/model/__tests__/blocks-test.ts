import { groupOpsByBlocks, BlockDescriptor, createScopedContentMerger } from '@model/blocks'
import { buildImageOp, buildTextOp } from '@delta/operations'
import { DocumentContent } from '@model/document'

describe('@model/blocks', () => {
  describe('groupOpsByBlocks', () => {
    it('should group text ops together', () => {
      const blocks = groupOpsByBlocks([buildTextOp('Hello'), buildTextOp('Great')])
      expect(blocks.length).toBe(1)
      expect(blocks).toMatchObject([
        {
          blockIndex: 0,
          kind: 'text',
          startSliceIndex: 0,
          endSliceIndex: 2,
          opsSlice: [buildTextOp('Hello'), buildTextOp('Great')],
          numOfSelectableUnits: 10,
          selectableUnitsOffset: 0,
        },
      ] as BlockDescriptor[])
    })
    it('should split groups of different kind', () => {
      const blocks = groupOpsByBlocks([buildTextOp('Hello'), buildTextOp('Great'), buildImageOp({ test: 1 })])
      expect(blocks.length).toBe(2)
      expect(blocks).toMatchObject([
        {
          blockIndex: 0,
          kind: 'text',
          startSliceIndex: 0,
          endSliceIndex: 2,
          opsSlice: [buildTextOp('Hello'), buildTextOp('Great')],
          numOfSelectableUnits: 10,
          selectableUnitsOffset: 0,
        },
        {
          blockIndex: 1,
          kind: 'image',
          startSliceIndex: 2,
          endSliceIndex: 3,
          opsSlice: [buildImageOp({ test: 1 })],
          numOfSelectableUnits: 1,
          selectableUnitsOffset: 10,
        },
      ] as BlockDescriptor[])
    })
    it('should handle empty ops', () => {
      const blocks = groupOpsByBlocks([buildTextOp('')])
      expect(blocks.length).toBe(1)
      expect(blocks).toMatchObject([
        {
          blockIndex: 0,
          kind: 'text',
          startSliceIndex: 0,
          endSliceIndex: 1,
          opsSlice: [buildTextOp('')],
          numOfSelectableUnits: 0,
          selectableUnitsOffset: 0,
        },
      ] as BlockDescriptor[])
    })
    it('should create a new group for each sibling image', () => {
      const blocks = groupOpsByBlocks([buildImageOp({ test: 1 }), buildImageOp({ test: 2 })])
      expect(blocks.length).toBe(2)
      expect(blocks).toMatchObject([
        {
          blockIndex: 0,
          kind: 'image',
          startSliceIndex: 0,
          endSliceIndex: 1,
          opsSlice: [buildImageOp({ test: 1 })],
          numOfSelectableUnits: 1,
          selectableUnitsOffset: 0,
        },
        {
          blockIndex: 1,
          kind: 'image',
          startSliceIndex: 1,
          endSliceIndex: 2,
          opsSlice: [buildImageOp({ test: 2 })],
          numOfSelectableUnits: 1,
          selectableUnitsOffset: 1,
        },
      ] as BlockDescriptor[])
    })
  })
  describe('createScopedContentMerger', () => {
    it('should merge selection of last block appropriately', () => {
      const ops = [buildTextOp('Hello'), buildImageOp({ test: 1 }), buildTextOp('Great')]
      const blocks = groupOpsByBlocks(ops)
      const document: DocumentContent = {
        currentSelection: { start: 0, end: 0 },
        ops,
        textAttributesAtCursor: {},
      }
      expect(blocks.length).toBe(3)
      const lastBlockMerger = createScopedContentMerger(blocks[2])
      const expectedObj: Partial<DocumentContent> = {
        currentSelection: {
          start: 6,
          end: 9,
        },
      }
      expect(lastBlockMerger({ currentSelection: { start: 0, end: 3 } }, document)).toMatchObject(expectedObj)
    })
    it('should merge ops appropriately', () => {
      const ops = [buildTextOp('Hello'), buildImageOp({ test: 1 }), buildTextOp('Great')]
      const blocks = groupOpsByBlocks(ops)
      const document: DocumentContent = {
        currentSelection: { start: 0, end: 0 },
        ops,
        textAttributesAtCursor: {},
      }
      expect(blocks.length).toBe(3)
      const middleBlockMerger = createScopedContentMerger(blocks[1])
      const expectedObj: Partial<DocumentContent> = {
        ops: [buildTextOp('Hello'), buildImageOp({ test: 1, width: 10 }), buildTextOp('Great')],
      }
      expect(middleBlockMerger({ ops: [buildImageOp({ test: 1, width: 10 })] }, document)).toMatchObject(expectedObj)
    })
  })
})
