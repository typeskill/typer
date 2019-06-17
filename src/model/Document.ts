import invariant from 'invariant'
import { TextBlock } from './TextBlock'
import { Block, BlockClass } from './Block'
import { Bridge } from '@core/Bridge'
import { Orchestrator } from '@model/Orchestrator'
import { Store } from './Store'
import { mergeAttributesLeft, Attributes } from '@delta/attributes'

declare namespace Document {
  export interface BlockInterface {
    readonly sheetEventDom: Bridge.SheetEventDomain
    readonly orchestrator: Orchestrator
    readonly onPressBackspaceFromOrigin: () => void
    readonly onPressEnter: () => void
  }

  export interface Consumer {
    readonly handleOnDocumentStateUpdate: Store.StateUpdateListener
    readonly sheetEventDom: Bridge.SheetEventDomain
  }
}

/**
 * The Document class represents the content printed on the Sheet.
 * It exposes methods to apply transformations.
 *
 */
class Document {
  private consumer?: Document.Consumer
  private orchestrator: Orchestrator = new Orchestrator()
  private store = new Store()

  private handleOnPressBackspaceFromOriginFromBlock(block: Block) {
    // TODO implement
    // console.info('Hey, pressing backspace from origin!')
    this.store.mergeAdjacentTextBlocks(block.getInstanceNumber())
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handleOnPressEnterFromBlock(block: Block) {
    // const selection = block.getSelection()
    // TODO implement
    // console.info('Hey, pressing enter from selection', selection.start, selection.end)
    this.insertBlock(TextBlock)
  }

  private newBlock(BlockKind: BlockClass) {
    invariant(this.consumer != null, 'A document consumer must be registered to create a block')
    if (this.consumer) {
      // @ts-ignore
      let block: Block = null
      let blockIface: Document.BlockInterface = {
        orchestrator: this.orchestrator,
        sheetEventDom: this.consumer.sheetEventDom,
        onPressBackspaceFromOrigin: () => this.handleOnPressBackspaceFromOriginFromBlock(block),
        onPressEnter: () => this.handleOnPressEnterFromBlock(block),
      }
      blockIface = Object.freeze(blockIface)
      block = new BlockKind(blockIface)
      return block
    }
    throw new Error()
  }

  /**
   * **Lifecycle method**: must be called when consumer is ready to handle document events.
   *
   * @param consumer - the document consumer.
   */
  public registerConsumer(consumer: Document.Consumer) {
    invariant(this.consumer === undefined, 'Only one document consumer can be registered at a time')
    this.store.addListener(consumer.handleOnDocumentStateUpdate)
    consumer.sheetEventDom.addSwitchLineTypeInSelectionListener(this, (lineType: Attributes.LineType) => {
      if (this.store.hasBlock()) {
        const selectedBlock = this.store.getActiveBlock() as TextBlock
        invariant(selectedBlock instanceof TextBlock, 'Line Transforms can only be applied to a TextBlock')
        const selectionBeforeChange = selectedBlock.getSelection()
        const atomicUpdate = selectedBlock.getDelta().applyLineTypeToSelection(selectionBeforeChange, lineType)
        selectedBlock.handleAtomicUpdate(atomicUpdate)
        this.orchestrator.emitToBlockController(
          selectedBlock.getInstanceNumber(),
          'CONTROL_DOMAIN_CONTENT_CHANGE',
          atomicUpdate,
        )
      }
    })
    consumer.sheetEventDom.addApplyTextTransformToSelectionListener(
      this,
      (attributeName: string, attributeValue: Attributes.GenericValue) => {
        if (this.store.hasBlock()) {
          const selectedBlock = this.store.getActiveBlock() as TextBlock
          invariant(selectedBlock instanceof TextBlock, 'Text Transforms can only be applied to a TextBlock')
          const delta = selectedBlock.getDelta()
          const selection = selectedBlock.getSelection()
          // Apply transforms to selection range
          const userAttributes = { [attributeName]: attributeValue }
          const atomicUpdate = delta.applyTextTransformToSelection(selection, attributeName, attributeValue)
          const deltaAttributes = atomicUpdate.delta.getSelectedTextAttributes(selection)
          const mergedCursorAttributes = selectedBlock.setCursorAttributes(userAttributes)
          const attributes = mergeAttributesLeft(deltaAttributes, mergedCursorAttributes)
          selectedBlock.handleAtomicUpdate(atomicUpdate)
          console.info('APPLYING TEXT TRANSFORM', attributes)
          // TODO investigate to refactor to block
          consumer.sheetEventDom.notifySelectedTextAttributesChange(attributes)
          this.orchestrator.emitToBlockController(
            selectedBlock.getInstanceNumber(),
            'CONTROL_DOMAIN_CONTENT_CHANGE',
            atomicUpdate,
          )
        }
      },
    )
    this.consumer = consumer
    this.insertBlock(TextBlock)
  }

  /**
   * **Lifecycle method**: must be called when consumer cannot handle document events anymore.
   *
   * @param consumer - The document consumer.
   */
  public releaseConsumer(consumer: Document.Consumer) {
    this.store.removeListener(consumer.handleOnDocumentStateUpdate)
    consumer.sheetEventDom.release(this)
    this.orchestrator.release()
    this.consumer = undefined
  }

  public insertBlock(BlockKind: BlockClass): void {
    this.store.appendBlock(this.newBlock(BlockKind))
  }

  public getActiveBlock(): Block {
    return this.store.getActiveBlock()
  }

  public getBlock(instanceNumber: number): Block {
    return this.store.getBlock(instanceNumber)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public emitToBlock(event: Orchestrator.SheetControllerEvent, instanceNumber: number, ...payload: any[]) {
    this.orchestrator.emitToBlockController(instanceNumber, event, ...payload)
  }
}

export { Document }
