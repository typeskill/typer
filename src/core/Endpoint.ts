import { EventEmitter, ListenerFn } from 'eventemitter3'

interface ListenerDescriptor<E extends string, L extends Function> {
  listener: L
  eventType: E
}

export class Endpoint<InnerEventType extends string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private owners = new WeakMap<object, ListenerDescriptor<InnerEventType, any>[]>()
  private domain = new EventEmitter<InnerEventType>()

  public addListener(owner: object, eventType: InnerEventType, listener: ListenerFn) {
    this.domain.addListener(eventType, listener)
    const listeners = this.owners.get(owner) || []
    listeners.push({
      eventType,
      listener,
    })
    this.owners.set(owner, listeners)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public emit(eventType: InnerEventType, ...payload: any[]): void {
    this.domain.emit(eventType, ...payload)
  }

  public release(owner: object) {
    const descriptors = this.owners.get(owner)
    if (descriptors) {
      for (const { listener, eventType } of descriptors) {
        this.domain.removeListener(eventType, listener)
      }
    }
    this.owners.delete(owner)
  }

  public removeAllListeners() {
    this.domain.removeAllListeners()
  }
}
