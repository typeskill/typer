import { Selection } from '@delta/Selection'
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
  private emitter: Orchestrator.BlockEmitterInterface

  constructor(
     blockInterface: Document.BlockInterface<T>
  ) {
    // tslint:disable-next-line:no-increment-decrement
    this.instanceNumber = lastInstanceNumber++
    this.blockInterface = blockInterface
    this.emitter = {
      emitToBlockController: (eventType: Orchestrator.SheetControllerEvent, ...payload: any[]) => {
        return this.blockInterface.orchestrator.emitToBlockController(
            this.getInstanceNumber(),
            eventType, ...payload
          )
      }
    }
  }

  abstract getLength(): number

  abstract getSelection(): Selection

  abstract handleOnSelectionChange(s: Selection): void

  updateDelta(textDiffDelta: DocumentDelta, normalizedDelta?: DocumentDelta) {
    this.blockInterface.updateDelta(textDiffDelta, normalizedDelta)
  }

  getDelta(): DocumentDelta {
    return this.blockInterface.getDelta()
  }

  getInstanceNumber(): number {
    return this.instanceNumber
  }

  getControllerInterface(): Orchestrator.BlockControllerInterface {
    return this.blockInterface.orchestrator.getblockControllerInterfaceForIndex(this.getInstanceNumber())
  }

  getEmitterInterface(): Orchestrator.BlockEmitterInterface {
    return this.emitter
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
