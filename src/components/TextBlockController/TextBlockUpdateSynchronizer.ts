import { DocumentDeltaUpdate } from '@delta/DocumentDeltaUpdate'
import { TextBlockComponent } from './types'
import DocumentDelta from '@delta/DocumentDelta'
import { UpdateTask } from './UpdateTask'

export class TextBlockUpdateSynchronizer {
  private _isClosed = false
  private _component: TextBlockComponent
  private runningTask: UpdateTask | null = null

  constructor(component: TextBlockComponent) {
    this._component = component
  }

  async handleFragmentedUpdate(update: DocumentDeltaUpdate) {
    this.runningTask && this.runningTask.cancelOverriding()
    const task = new UpdateTask(this)
    if (update.hasIntermediaryDelta()) {
      task.pushUpdateFragment(update.intermediaryDelta as DocumentDelta, update.intermediaryOverridingSelection)
    }
    task.pushUpdateFragment(update.finalDelta, update.finalOverridingSelection)
    this.runningTask = task
    return task.run()
  }

  get component() {
    return this._component
  }

  get isClosed() {
    return this._isClosed
  }

  isRunning() {
    return this.runningTask && this.runningTask.isRunning()
  }

  release() {
    this._isClosed = true
  }
}
