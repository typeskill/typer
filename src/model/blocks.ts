import { GenericOp } from '@delta/operations'
import last from 'ramda/es/last'
import Op from 'quill-delta/dist/Op'
import { Block } from './Block'

export type BlockType = 'image' | 'text'

export interface BlockDescriptor {
  /**
   * Inclusive begining of Op slice index.
   */
  startSliceIndex: number
  /**
   * Exclusive end of Op slice index.
   */
  endSliceIndex: number
  /**
   * The offset to apply to selection.
   */
  selectableUnitsOffset: number
  /**
   * The number of selectable units.
   */
  numOfSelectableUnits: number
  blockIndex: number
  maxBlockIndex: number
  kind: BlockType
  opsSlice: GenericOp[]
}

function opsToBlocks(blocks: Block[], currentValue: GenericOp, i: number, l: GenericOp[]): Block[] {
  if (currentValue.insert === undefined) {
    return blocks
  }
  const kind: BlockType = typeof currentValue.insert === 'string' ? 'text' : 'image'
  let lastGroup: Block = last(blocks) as Block
  const isFirstGroup = !lastGroup
  if (isFirstGroup) {
    lastGroup = new Block(
      {
        kind,
        opsSlice: [],
        startSliceIndex: 0,
        endSliceIndex: 0,
        numOfSelectableUnits: 0,
        selectableUnitsOffset: 0,
        blockIndex: 0,
        maxBlockIndex: l.length - 1,
      },
      blocks,
    )
    blocks.push(lastGroup)
  }
  const lastBlockDesc = lastGroup.descriptor
  if (lastBlockDesc.kind !== kind || (kind === 'image' && !isFirstGroup)) {
    const kindOps = [currentValue]
    const newGroup: Block = new Block(
      {
        kind,
        opsSlice: kindOps,
        numOfSelectableUnits: Op.length(currentValue),
        startSliceIndex: lastBlockDesc.endSliceIndex,
        endSliceIndex: lastBlockDesc.endSliceIndex + 1,
        blockIndex: lastBlockDesc.blockIndex + 1,
        selectableUnitsOffset: lastBlockDesc.numOfSelectableUnits + lastBlockDesc.selectableUnitsOffset,
        maxBlockIndex: l.length - 1,
      },
      blocks,
    )
    blocks.push(newGroup)
  } else {
    lastBlockDesc.opsSlice.push(currentValue)
    lastBlockDesc.numOfSelectableUnits += Op.length(currentValue)
    lastBlockDesc.endSliceIndex += 1
  }
  return blocks
}

export function groupOpsByBlocks(ops: GenericOp[]): Block[] {
  return ops.reduce<Block[]>(opsToBlocks, [])
}
