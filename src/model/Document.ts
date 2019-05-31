import DocumentDelta from '@delta/DocumentDelta'
import invariant from 'invariant'
import TextBlock from './TextBlock'
import Block from './Block'
import Bridge from '@core/Bridge'
import Orchestrator from '@model/Orchestrator'
import Store from './Store'
import { TextLineType } from '@delta/transforms'
import { mergeAttributesRight } from '@delta/attributes'

declare namespace Document {
  export interface BlockInterface<T extends string> {
    readonly bridgeInnerInterface: Bridge.InnerInterface<T>
    readonly orchestrator: Orchestrator
    readonly updateDelta: (nuDelta: DocumentDelta) => void
    readonly onPressBackspaceFromOrigin: () => void
    readonly onPressEnter: () => void
    readonly getDelta: () => DocumentDelta
  }

  export interface Consumer<T extends string> {
    readonly handleOnDocumentStateUpdate: Store.StateUpdateListener
    readonly bridgeInnerInterface: Bridge.InnerInterface<T>
  }
}

/**
 * The Document class represents the content printed on the Sheet.
 * It exposes methods to apply transformations.
 * 
 */
class Document<T extends string> {
  private consumer?: Document.Consumer<T>
  private orchestrator: Orchestrator = new Orchestrator()
  private store = new Store()

  private handleOnPressBackspaceFromOriginFromBlock(block: Block) {
    // TODO implement
    // console.info('Hey, pressing backspace from origin!')
    this.store.mergeAdjacentTextBlocks(block.getInstanceNumber())
  }

  private handleOnPressEnterFromBlock(block: Block) {
    // const selection = block.getSelection()
    // TODO implement
    // console.info('Hey, pressing enter from selection', selection.start, selection.end)
    this.insertBlock(TextBlock)
  }

  private newBlock(BlockKind: Block.Class<T>, initDelta?: DocumentDelta) {
    invariant(this.consumer != null, 'A document consumer must be registered to create a block')
    if (this.consumer) {
      const blockIface: Document.BlockInterface<T> = Object.freeze({
        orchestrator: this.orchestrator,
        bridgeInnerInterface: this.consumer.bridgeInnerInterface,
        updateDelta: (nuDelta: DocumentDelta) => {
          invariant(nuDelta instanceof DocumentDelta, 'documentDelta instanceof DocumentDelta')
          if (nuDelta) {
            this.store.updateDeltaForBlockInstance(block.getInstanceNumber(), nuDelta)
          }
        },
        onPressBackspaceFromOrigin: () => this.handleOnPressBackspaceFromOriginFromBlock(block),
        onPressEnter: () => this.handleOnPressEnterFromBlock(block),
        getDelta: () => this.store.getDelta(block.getInstanceNumber())
      })
      const block = new BlockKind(blockIface)
      return block
    }
    throw new Error()
  }

  /**
   * **Lifecycle method**: must be called when consumer is ready to handle document events.
   * 
   * @param consumer 
   */
  public registerConsumer(consumer: Document.Consumer<T>) {
    invariant(this.consumer === undefined, 'Only one document consumer can be registered at a time')
    this.store.addListener(consumer.handleOnDocumentStateUpdate)
    consumer.bridgeInnerInterface.addApplyLineTypeToSelectionListener(this, (lineType: TextLineType) => {
      if (this.store.hasBlock()) {
        const selectedBlock = this.store.getActiveBlock() as TextBlock<T>
        invariant(selectedBlock instanceof TextBlock, 'Line Transforms can only be applied to a TextBlock')
        const selectionBeforeChange = selectedBlock.getSelection()
        const { delta: updatedDelta, selection: selectionAfterChange } = selectedBlock.getDelta().applyLineTypeToSelection(selectionBeforeChange, lineType)
        const updateLineType = updatedDelta.getLineTypeInSelection(selectionBeforeChange)
        this.store.updateDeltaForBlockInstance(selectedBlock.getInstanceNumber(), updatedDelta)
        consumer.bridgeInnerInterface.setSelectedLineType(updateLineType)
        this.orchestrator.emitToBlockController(selectedBlock.getInstanceNumber(), 'SELECTION_OVERRIDE', selectionAfterChange)
      }
    })
    consumer.bridgeInnerInterface.addApplyTextTransformToSelectionListener(this, (attributeName: T, attributeValue: any) => {
      if (this.store.hasBlock()) {
        const selectedBlock = this.store.getActiveBlock() as TextBlock<T>
        invariant(selectedBlock instanceof TextBlock, 'Text Transforms can only be applied to a TextBlock')
        const delta = selectedBlock.getDelta()
        const selection = selectedBlock.getSelection()
        // Apply transforms to selection range
        const userAttributes = { [attributeName]: attributeValue }
        const updatedDelta = delta.applyTextTransformToSelection(selection, attributeName, attributeValue)
        const deltaAttributes = updatedDelta.getSelectedTextAttributes(selection)
        const attributes = mergeAttributesRight(deltaAttributes, userAttributes)
        this.orchestrator.emitToBlockController(selectedBlock.getInstanceNumber(), 'SELECTION_RANGE_ATTRIBUTES_UPDATE', deltaAttributes)
        this.store.updateDeltaForBlockInstance(selectedBlock.getInstanceNumber(), updatedDelta)
        selectedBlock.setCursorAttributes(userAttributes)
        consumer.bridgeInnerInterface.setSelectedTextAttributes(attributes)
      }
    })
    this.consumer = consumer
    this.insertBlock(TextBlock)
  }

  /**
   * **Lifecycle method**: must be called when consumer cannot handle document events anymore.
   * 
   * @param consumer 
   */
  public releaseConsumer(consumer: Document.Consumer<T>) {
    this.store.removeListener(consumer.handleOnDocumentStateUpdate)
    consumer.bridgeInnerInterface.release(this)
    this.orchestrator.release()
    this.consumer = undefined
  }

  public insertBlock(BlockKind: Block.Class<T>, initDelta?: DocumentDelta): void {
    this.store.appendBlock(this.newBlock(BlockKind, initDelta), initDelta)
  }

  public getActiveBlock(): Block<T> {
    return this.store.getActiveBlock()
  }

  public getBlock(instanceNumber: number): Block<T> {
    return this.store.getBlock(instanceNumber)
  }

  public emitToBlock(event: Orchestrator.SheetControllerEvent, instanceNumber: number, ...payload: any[]) {
    this.orchestrator.emitToBlockController(instanceNumber, event, ...payload)
  }
}

export default Document
