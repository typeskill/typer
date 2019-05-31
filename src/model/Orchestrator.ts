import EventEmitter, { ListenerFn } from 'eventemitter3'

declare namespace Orchestrator {
  export interface BlockControllerInterface {
    addListener: (eventType: SheetControllerEvent, listener: SheetControllerEventListener) => void
    release: () => void
  }

  /**
   * Events produced by the Sheet Controller
   */
  export type SheetControllerEvent = 'FOCUS_REQUEST' | 'SELECTION_RANGE_ATTRIBUTES_UPDATE' | 'SELECTION_OVERRIDE'

  export type SheetControllerEventListener = ListenerFn
}

/**
 * The Orchestrator is an envent-based class responsible for communication between InputControllers within the Sheet.
 */
class Orchestrator {
  private controllersEmitters: Map<number, EventEmitter<Orchestrator.SheetControllerEvent>> = new Map()
  private interfaces: Map<number, Orchestrator.BlockControllerInterface> = new Map()

  private makeBlockControllerInterfaceForInstance(inputControllerInstance: number): Orchestrator.BlockControllerInterface {
    const inputCInterface = {
      release: () => {
        const emitter = this.controllersEmitters.get(inputControllerInstance)
        if (emitter) {
          emitter.removeAllListeners()
          this.controllersEmitters.delete(inputControllerInstance)
        }
        this.interfaces.delete(inputControllerInstance)
      },
      addListener: (eventType: Orchestrator.SheetControllerEvent, listener: Orchestrator.SheetControllerEventListener) => {
        let emitter = this.controllersEmitters.get(inputControllerInstance)
        if (!emitter) {
          emitter = new EventEmitter()
          this.controllersEmitters.set(inputControllerInstance, emitter)
        }
        emitter.addListener(eventType, listener)
      }
    }
    this.interfaces.set(inputControllerInstance, inputCInterface)
    return inputCInterface
  }

  emitToBlockController(inputControllerInstance: number, eventType: Orchestrator.SheetControllerEvent, ...payload: any[]): void {
    const controller = this.controllersEmitters.get(inputControllerInstance)
    if (controller) {
      controller.emit(eventType, ...payload)
    }
  }

  getblockControllerInterfaceForIndex(blockControllerInstance: number): Orchestrator.BlockControllerInterface {
    if (!this.interfaces.has(blockControllerInstance)) {
      return this.makeBlockControllerInterfaceForInstance(blockControllerInstance)
    }
    return this.interfaces.get(blockControllerInstance) as Orchestrator.BlockControllerInterface
  }

  release() {
    for (const emitter of this.controllersEmitters.values()) {
      emitter.removeAllListeners()
    }
    this.interfaces.clear()
  }
}

export default Orchestrator
