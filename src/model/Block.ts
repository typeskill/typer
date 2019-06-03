import { Selection } from '@delta/selection'
import Document from './Document'
import DocumentDelta from '@delta/DocumentDelta'
import { boundMethod } from 'autobind-decorator'
import Orchestrator from './Orchestrator'

let lastInstanceNumber = 0

export function setInstanceNumber(num: number) {
  lastInstanceNumber = num
}

abstract class Block<T extends string = any> {
  private instanceNumber: number
  protected blockInterface: Document.BlockInterface<T>

  constructor(
     blockInterface: Document.BlockInterface<T>
  ) {
    // tslint:disable-next-line:no-increment-decrement
    this.instanceNumber = lastInstanceNumber++
    this.blockInterface = blockInterface
  }

  protected updateDelta(diffDelta: DocumentDelta) {
    this.blockInterface.updateDelta(diffDelta)
  }

  abstract getLength(): number

  abstract getSelection(): Selection

  abstract handleOnSelectionChange(s: Selection): void

  getDelta(): DocumentDelta {
    return this.blockInterface.getDelta()
  }

  getInstanceNumber(): number {
    return this.instanceNumber
  }

  getControllerInterface(): Orchestrator.BlockControllerInterface {
    return this.blockInterface.orchestrator.getblockControllerInterfaceForIndex(this.getInstanceNumber())
  }

  @boundMethod
  handleOnSubmitEditing() {
    this.blockInterface.onPressEnter()
  }

  @boundMethod
  handleOnKeyPress(key: string) {
    const { start, end } = this.getSelection()
    if (key === 'Backspace' && start === 0 && end === 0) {
      this.blockInterface.onPressBackspaceFromOrigin()
    }
  }
}

declare namespace Block {
  export type Class<T extends string> = new(blockIface: Document.BlockInterface<T>) => Block<T>
}

export default Block
