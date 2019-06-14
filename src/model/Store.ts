import { DocumentDelta } from '@delta/DocumentDelta'
import clone from 'ramda/es/clone'
import concat from 'ramda/es/concat'
import without from 'ramda/es/without'
import mergeRight from 'ramda/es/mergeRight'
import { Block } from './Block'
import invariant from 'invariant'
import last from 'ramda/es/last'
import indexOf from 'ramda/es/indexOf'

declare namespace Store {
  export type BlockOrderMap = number[]

  export interface BlockDeltas {
    [instanceNum: number]: DocumentDelta
  }

  export interface State {
    selectedBlockInstanceNumber: number | null
    blockOrders: BlockOrderMap
  }

  export type StateUpdateListener = (state: State) => void
}

const INITIAL_STATE = Object.freeze({
  selectedBlockInstanceNumber: null,
  blockOrders: [],
  deltas: {},
})

export function getStoreInitialState() {
  return clone(INITIAL_STATE)
}

class Store<T extends string = any> {
  private state: Store.State = getStoreInitialState()
  private listeners: Set<Store.StateUpdateListener> = new Set()
  private blockReverseMap: Map<number, Block<T>> = new Map()

  private updateState(update: Partial<Store.State>) {
    this.state = mergeRight(this.state, update) as Store.State
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }

  private getAtomicBlockDeletion(instanceNumber: number) {
    this.blockReverseMap.delete(instanceNumber)
    const blockOrders = without([instanceNumber], this.state.blockOrders)
    return {
      blockOrders,
      selectedBlockInstanceNumber: last(blockOrders),
    }
  }

  private getAtomicBlockInsertion(block: Block<T>) {
    return {
      selectedBlockInstanceNumber: block.getInstanceNumber(),
      blockOrders: concat(this.state.blockOrders, [block.getInstanceNumber()]),
    }
  }

  public appendBlock(block: Block<T>) {
    this.blockReverseMap.set(block.getInstanceNumber(), block)
    this.updateState(this.getAtomicBlockInsertion(block))
  }

  public mergeAdjacentTextBlocks(instanceNumber: number) {
    const upperIndex = indexOf(instanceNumber, this.state.blockOrders)
    if (upperIndex > 0) {
      const atomicDeletion = this.getAtomicBlockDeletion(instanceNumber)
      this.updateState(atomicDeletion)
    }
  }

  public deleteBlock(instanceNumber: number) {
    this.updateState(this.getAtomicBlockDeletion(instanceNumber))
  }

  public hasBlock() {
    return typeof this.state.selectedBlockInstanceNumber === 'number'
  }

  public getActiveBlock(): Block<T> {
    invariant(
      typeof this.state.selectedBlockInstanceNumber === 'number',
      'At least one block must be selected to call getSelectedBlock',
    )
    return this.blockReverseMap.get(this.state.selectedBlockInstanceNumber as number) as Block<T>
  }

  public getBlock(instanceNumber: number): Block<T> {
    invariant(
      this.blockReverseMap.has(instanceNumber),
      `Block with instance number ${instanceNumber} is not registered.`,
    )
    return this.blockReverseMap.get(instanceNumber) as Block<T>
  }

  public addListener(listener: Store.StateUpdateListener) {
    this.listeners.add(listener)
  }

  public removeListener(listener: Store.StateUpdateListener) {
    this.listeners.delete(listener)
  }
}

export { Store }
