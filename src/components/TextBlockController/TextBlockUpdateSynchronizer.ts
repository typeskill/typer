import { DocumentDeltaUpdate } from '@delta/DocumentDeltaUpdate'
import { TextBlockComponent } from './types'
import { DocumentDelta } from '@delta/DocumentDelta'
import { UpdateTask } from './UpdateTask'

export class TextBlockUpdateSynchronizer {
  private _isClosed = false
  private _component: TextBlockComponent
  private runningTask: UpdateTask | null = null

  public constructor(component: TextBlockComponent) {
    this._component = component
  }

  public async handleFragmentedUpdate(update: DocumentDeltaUpdate) {
    this.runningTask && this.runningTask.cancelOverriding()
    const task = new UpdateTask(this)
    if (update.hasIntermediaryDelta()) {
      task.pushUpdateFragment(update.intermediaryDelta as DocumentDelta, update.intermediaryOverridingSelection)
    }
    task.pushUpdateFragment(update.finalDelta, update.finalOverridingSelection)
    this.runningTask = task
    return task.run()
  }

  public get component() {
    return this._component
  }

  public get isClosed() {
    return this._isClosed
  }

  public isRunning() {
    return this.runningTask && this.runningTask.isRunning()
  }

  public release() {
    this._isClosed = true
  }
}
