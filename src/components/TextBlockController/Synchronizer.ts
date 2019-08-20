import { TextChangeSession } from './TextChangeSession'
import { Selection } from '@delta/Selection'
import { NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'
import AsyncLock from 'async-lock'
import { DocumentDelta } from '@delta/DocumentDelta'
import { TextOp } from '@delta/operations'
import { Attributes } from '@delta/attributes'

const LOCK_NAME = 'Sync'

export interface SyncSubject {
  overrideSelection: (overridingSelection: Selection) => Promise<void>
  updateSelection: (updatedSelection: Selection) => Promise<void>
  updateOps: (textOps: TextOp[]) => Promise<void>
  getCurrentSelection: () => Selection
  getTextAttributesAtCursor: () => Attributes.Map
  getOps: () => TextOp[]
}

/**
 * An entity responsible for granting state consistency in the {@link TextBlockController} component.
 *
 * @privateRemarks
 *
 * The synchronization mechanism is complex, because of three potential state discrepancies.
 *
 * **Fake equality**
 *
 * The second one is not a bug, but rather a feature of React virtual DOM engine. To understand the challange, lets propose a scenario:
 *
 * - The user types a word
 * - {@link react-native#TextInputProps.onChangeText} is fired
 * - {@link react-native#TextInputProps.onSelectionChange} is fired
 *
 * At that point, a delta is computed from text change and selection before and after change.
 * This delta strictly represents the result of applying a text diff algorithm to the previous text.
 *
 * Because of ordered and unordered lists in the context of a pure-text component, there is a set of rules which define
 * if applying a delta should result in adding or removing a text prefix. This phase is called *normalization*.
 *
 * Therefore, it appears that up to two delta might be computed for one {@link react-native#TextInputProps.onChangeText} call.
 * The concern is that, if we were to update component state with the latest delta alone, we could run into a situation were this
 * delta deeeply equals the previous delta, and thus the VDOM diff algorithm detects no changes after rerendering.
 *
 * This is why **we must serialy apply two delta updates when a normalization process happens**. We call this process *serial update*,
 * and the data necessary to perform such is encapsulated in the {@link DocumentDeltaSerialUpdate} class.
 *
 * **Selection discrepancy**
 *
 * Because of *normalization*, the active selection in native {@link react-native#TextInput} component might become inconsistant.
 * That is why we must update it during a *serial update*. We call this process *selection override*.
 *
 * However, {@link https://git.io/fjamu | a bug in RN < 60} prevents updating selection and text during the same
 * render cycle. Instead, any selection override must happen after the next {@link react-native#TextInputProps.onSelectionChange} call
 * following a render cycle.
 *
 * **Atomicity**
 *
 * A new issue might emerge during a *serial update*. That is: user types during the update, and the consistency breaks, introducing bugs.
 * One solution could be to lock state during update. But that would prevent the user from typing; not acceptable for UX.
 *
 * Another solution would be to deterministically infer a new state from this text update disruption. To do so, lets cut a *serial update*
 * into a list of atomic updates. Required updates are marked with an asterisk (*):
 *
 * 1. intermediary rich content (delta) update
 * 2. intermediary selection update
 * 3. final rich content (delta) update*
 * 4. final selection update
 *
 * When {@link react-native#TextInputProps.onChangeText} is called between one of these steps, we can:
 *
 * 1. compute a new *serial update* from the last delta passed to state
 * 2. ignore forthcoming atomic updates from the original *serial update*
 *
 */
export class Synchronizer {
  private textChangeSession: TextChangeSession | null = null
  private subject: SyncSubject
  private nextSelectionOverride: (() => void) | null = null
  private lock = new AsyncLock()

  private async acquireLock(executee: () => Promise<void>): Promise<void> {
    await this.lock.acquire(LOCK_NAME, executee)
  }

  private async overrideSelection(overridingSelection: Selection) {
    return this.subject.overrideSelection(overridingSelection)
  }

  private async performAtomicUpdate(atomicDeltaUpdate: DocumentDeltaAtomicUpdate): Promise<void> {
    await this.subject.updateOps(atomicDeltaUpdate.delta.ops as TextOp[])
    const overridingSelection = atomicDeltaUpdate.overridingSelection
    console.info('HAS OVERRIDING SELECTION', overridingSelection)
    if (overridingSelection) {
      let hasCalledSelUpdate = false
      return Promise.race([
        new Promise<void>(res => {
          this.nextSelectionOverride = () => {
            hasCalledSelUpdate = true
            this.overrideSelection(overridingSelection).then(res)
          }
        }),
        new Promise<void>(res => {
          setTimeout(() => {
            if (!hasCalledSelUpdate) {
              this.overrideSelection(overridingSelection).then(res)
            } else {
              res()
            }
          }, 100)
        }),
      ])
    }
  }

  public constructor(syncSubject: SyncSubject) {
    this.subject = syncSubject
  }

  /**
   * **Preconditions**: this method must be called before handleOnSelectionChange
   * This is the current TextInput behavior.
   *
   * @param nextText
   */
  public handleOnSheetDomainTextChanged(nextText: string) {
    if (!this.lock.isBusy()) {
      this.textChangeSession = new TextChangeSession()
      this.textChangeSession.setTextAfterChange(nextText)
      this.textChangeSession.setSelectionBeforeChange(this.subject.getCurrentSelection())
    }
  }

  /**
   * **Preconditions**: this method must be called after handleOnTextChanged
   *
   * @param textInputSelectionChangeEvent
   */
  public handleOnSheetDomainSelectionChange(
    textInputSelectionChangeEvent: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ): Promise<void> {
    const {
      nativeEvent: { selection },
    } = textInputSelectionChangeEvent
    const nextSelection = Selection.between(selection.start, selection.end)
    let promise = Promise.resolve()
    if (this.nextSelectionOverride) {
      this.nextSelectionOverride()
      this.nextSelectionOverride = null
    }
    if (this.textChangeSession !== null) {
      this.textChangeSession.setSelectionAfterChange(nextSelection)
      const ops = this.subject.getOps()
      const documentDeltaUpdate = new DocumentDelta(ops).applyTextDiff(
        this.textChangeSession.getTextAfterChange(),
        this.textChangeSession.getDeltaChangeContext(),
        this.subject.getTextAttributesAtCursor(),
      )
      promise = this.performAtomicUpdate(documentDeltaUpdate)
      this.textChangeSession = null
    } else {
      promise = this.subject.updateSelection(nextSelection)
    }
    return promise
  }

  public handleControlDomainContentChange(contentChange: DocumentDeltaAtomicUpdate) {
    this.acquireLock(() => {
      return this.performAtomicUpdate(contentChange)
    })
  }

  public release() {}
}
