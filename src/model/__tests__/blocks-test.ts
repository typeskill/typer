import { groupOpsByBlocks, BlockDescriptor } from '@model/blocks'
import { buildTextOp } from '@delta/operations'
import prop from 'ramda/es/prop'
import { buildDummyImageOp } from '@test/document'

describe('@model/blocks', () => {
  describe('groupOpsByBlocks', () => {
    it('should group text ops together', () => {
      const blocks = groupOpsByBlocks([buildTextOp('Hello'), buildTextOp('Great')])
      expect(blocks.length).toBe(1)
      const expectedDesc: BlockDescriptor = {
        blockIndex: 0,
        kind: 'text',
        startSliceIndex: 0,
        endSliceIndex: 2,
        opsSlice: [buildTextOp('Hello'), buildTextOp('Great')],
        numOfSelectableUnits: 10,
        selectableUnitsOffset: 0,
        maxBlockIndex: 1,
      }
      expect(blocks[0].descriptor).toMatchObject(expectedDesc)
    })
    it('should split groups of different kind', () => {
      const helloOp = buildTextOp('Hello')
      const greatOp = buildTextOp('Great')
      const imgOp = buildDummyImageOp()
      const blocks = groupOpsByBlocks([helloOp, greatOp, imgOp])
      expect(blocks.length).toBe(2)
      expect(blocks.map(prop('descriptor'))).toMatchObject([
        {
          blockIndex: 0,
          kind: 'text',
          startSliceIndex: 0,
          endSliceIndex: 2,
          opsSlice: [helloOp, greatOp],
          numOfSelectableUnits: 10,
          selectableUnitsOffset: 0,
        },
        {
          blockIndex: 1,
          kind: 'image',
          startSliceIndex: 2,
          endSliceIndex: 3,
          opsSlice: [imgOp],
          numOfSelectableUnits: 1,
          selectableUnitsOffset: 10,
        },
      ] as BlockDescriptor[])
    })
    it('should handle empty ops', () => {
      const blocks = groupOpsByBlocks([buildTextOp('')])
      expect(blocks.length).toBe(1)
      expect(blocks.map(prop('descriptor'))).toMatchObject([
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
      const blocks = groupOpsByBlocks([buildDummyImageOp('A'), buildDummyImageOp('B')])
      expect(blocks.length).toBe(2)
      expect(blocks.map(prop('descriptor'))).toMatchObject([
        {
          blockIndex: 0,
          kind: 'image',
          startSliceIndex: 0,
          endSliceIndex: 1,
          opsSlice: [buildDummyImageOp('A')],
          numOfSelectableUnits: 1,
          selectableUnitsOffset: 0,
        },
        {
          blockIndex: 1,
          kind: 'image',
          startSliceIndex: 1,
          endSliceIndex: 2,
          opsSlice: [buildDummyImageOp('B')],
          numOfSelectableUnits: 1,
          selectableUnitsOffset: 1,
        },
      ] as BlockDescriptor[])
    })
  })
})
