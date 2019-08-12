import { Selection } from '@delta/Selection'
import { Document } from './Document'
import { DocumentDelta } from '@delta/DocumentDelta'
import { boundMethod } from 'autobind-decorator'
import { Orchestrator } from './Orchestrator'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'

let lastInstanceNumber = 0

export function setInstanceNumber(num: number) {
  lastInstanceNumber = num
}

export abstract class Block {
  protected delta: DocumentDelta = new DocumentDelta()
  private instanceNumber: number
  protected blockInterface: Document.BlockInterface
  private selection = Selection.fromBounds(0)

  public constructor(blockInterface: Document.BlockInterface) {
    // tslint:disable-next-line:no-increment-decrement
    this.instanceNumber = lastInstanceNumber++
    this.blockInterface = blockInterface
  }

  abstract getLength(): number

  protected setSelection(selection: Selection) {
    this.selection = selection
  }

  public getSelection(): Selection {
    return this.selection
  }

  abstract handleOnSelectionChange(s: Selection): void

  /**
   * @virtual
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected afterAtomicUpdate(update: DocumentDeltaAtomicUpdate) {}

  public handleAtomicUpdate(update: DocumentDeltaAtomicUpdate) {
    this.delta = update.delta
    this.setSelection(update.selectionAfterChange)
    this.afterAtomicUpdate(update)
  }

  protected *transformSerialUpdateToGenerator(
    serialUpdate: DocumentDeltaAtomicUpdate,
  ): IterableIterator<DocumentDeltaAtomicUpdate> {
    this.handleAtomicUpdate(serialUpdate)
    yield serialUpdate
  }

  public getDelta(): DocumentDelta {
    return this.delta
  }

  public getInstanceNumber(): number {
    return this.instanceNumber
  }

  public getControllerInterface(): Orchestrator.BlockControllerInterface {
    return this.blockInterface.orchestrator.getblockControllerInterfaceForIndex(this.getInstanceNumber())
  }

  @boundMethod
  public handleOnSubmitEditing() {
    this.blockInterface.onPressEnter()
  }

  @boundMethod
  public handleOnKeyPress(key: string) {
    const { start, end } = this.getSelection()
    if (key === 'Backspace' && start === 0 && end === 0) {
      this.blockInterface.onPressBackspaceFromOrigin()
    }
  }
}

export type BlockClass = new (blockIface: Document.BlockInterface) => Block
