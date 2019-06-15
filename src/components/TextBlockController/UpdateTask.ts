import { Selection } from '@delta/Selection'
import { GenericRichContent } from '@delta/generic'
import { InteractionManager } from 'react-native'
import { TextBlockMinimalComponent } from './types'
import { DocumentDelta } from '@delta/DocumentDelta'

interface TaskManager {
  isClosed: boolean
  component: TextBlockMinimalComponent
}

export class UpdateTask {
  private synchronizer: TaskManager
  private cancelledOverriding = false
  private running = false
  private updates: (() => Promise<void>)[] = []

  public constructor(manager: TaskManager) {
    this.synchronizer = manager
  }

  private async setOps(richContent: GenericRichContent): Promise<void> {
    return new Promise(resolve => {
      if (!this.synchronizer.isClosed) {
        this.synchronizer.component.setState({ richContent }, resolve)
      } else {
        resolve()
      }
    })
  }

  private async setSelection(selection: Selection): Promise<void> {
    return new Promise(resolve => {
      // Using the interaction manager prevents the setSpan error
      // caused by text and selection being out of sync.
      InteractionManager.runAfterInteractions(() => {
        if (!this.synchronizer.isClosed && !this.cancelledOverriding) {
          this.synchronizer.component.setState({ overridingSelection: selection }, resolve)
        } else {
          resolve()
        }
      })
    })
  }

  public isRunning() {
    return this.running
  }

  public pushUpdateFragment(delta: DocumentDelta, overridingSelection: Selection | null) {
    this.updates.push(async () => this.setOps(delta))
    overridingSelection && this.updates.push(async () => this.setSelection(overridingSelection))
  }

  public cancelOverriding() {
    this.cancelledOverriding = true
    this.running = false
  }

  public run(): Promise<void> {
    const updates = [
      ...this.updates,
      async () => {
        this.running = false
      },
    ]
    const promise: Promise<void> = updates.reduce(async (prom, task) => prom.then(task), Promise.resolve())
    this.running = true
    return promise
  }
}
