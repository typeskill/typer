import { GenericOp } from '@delta/operations'
import last from 'ramda/es/last'
import Op from 'quill-delta/dist/Op'
import reduce from 'ramda/es/reduce'

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
  kind: BlockType
  opsSlice: GenericOp[]
}

const reduceOps = reduce((acc: BlockDescriptor[], currentValue: GenericOp) => {
  if (currentValue.insert === undefined) {
    return acc
  }
  const kind: BlockType = typeof currentValue.insert === 'string' ? 'text' : 'image'
  let lastGroup: BlockDescriptor = last(acc) as BlockDescriptor
  const isFirstGroup = !lastGroup
  if (isFirstGroup) {
    lastGroup = {
      kind,
      opsSlice: [],
      startSliceIndex: 0,
      endSliceIndex: 0,
      numOfSelectableUnits: 0,
      selectableUnitsOffset: 0,
      blockIndex: 0,
    }
    acc.push(lastGroup)
  }
  if (lastGroup.kind !== kind || (kind === 'image' && !isFirstGroup)) {
    const kindOps = [currentValue]
    const newGroup: BlockDescriptor = {
      kind,
      opsSlice: kindOps,
      numOfSelectableUnits: Op.length(currentValue),
      startSliceIndex: lastGroup.endSliceIndex,
      endSliceIndex: lastGroup.endSliceIndex + 1,
      blockIndex: lastGroup.blockIndex + 1,
      selectableUnitsOffset: lastGroup.numOfSelectableUnits + lastGroup.selectableUnitsOffset + 1,
    }
    acc.push(newGroup)
  } else {
    lastGroup.opsSlice.push(currentValue)
    lastGroup.numOfSelectableUnits += Op.length(currentValue)
    lastGroup.endSliceIndex += 1
  }
  return acc
})

export const groupOpsByBlocks = (ops: GenericOp[]) => reduceOps([], ops)
