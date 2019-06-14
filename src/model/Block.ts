import { Selection } from '@delta/Selection'
import { Document } from './Document'
import { DocumentDelta } from '@delta/DocumentDelta'
import { boundMethod } from 'autobind-decorator'
import { Orchestrator } from './Orchestrator'
import { DocumentDeltaUpdate } from '@delta/DocumentDeltaUpdate'

let lastInstanceNumber = 0

export function setInstanceNumber(num: number) {
  lastInstanceNumber = num
}

export abstract class Block<T extends string = any> {
  private instanceNumber: number
  protected blockInterface: Document.BlockInterface<T>
  protected selection = Selection.fromBounds(0)

  public constructor(blockInterface: Document.BlockInterface<T>) {
    // tslint:disable-next-line:no-increment-decrement
    this.instanceNumber = lastInstanceNumber++
    this.blockInterface = blockInterface
  }

  abstract getLength(): number

  public getSelection(): Selection {
    return this.selection
  }

  abstract handleOnSelectionChange(s: Selection): void

  public updateDelta(documentDeltaUpdate: DocumentDeltaUpdate) {
    this.selection = documentDeltaUpdate.intermediaryOverridingSelection || this.selection
    this.blockInterface.updateDelta(documentDeltaUpdate)
  }

  public getDelta(): DocumentDelta {
    return this.blockInterface.getDelta()
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

export type BlockClass<T extends string> = new (blockIface: Document.BlockInterface<T>) => Block<T>
