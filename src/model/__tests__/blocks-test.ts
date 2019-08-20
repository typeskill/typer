import { groupOpsByBlocks, BlockDescriptor } from '@model/blocks'
import { buildImageOp, buildTextOp } from '@delta/operations'

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
          selectableUnitsOffset: 11,
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
          selectableUnitsOffset: 2,
        },
      ] as BlockDescriptor[])
    })
  })
})
