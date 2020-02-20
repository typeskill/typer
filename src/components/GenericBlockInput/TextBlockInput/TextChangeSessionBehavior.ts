import { NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native'
import { TextChangeSession } from './TextChangeSession'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'
import { Selection, SelectionShape } from '@delta/Selection'
import { TextOp } from '@delta/operations'
import { DocumentDelta } from '@delta/DocumentDelta'
import { Attributes } from '@delta/attributes'

export interface TextChangeSessionOwner {
  getTextChangeSession: () => TextChangeSession | null
  setTextChangeSession: (textChangeSession: TextChangeSession | null) => void
  updateOps: (documentDeltaUpdate: DocumentDeltaAtomicUpdate) => void
  getBlockScopedSelection: () => SelectionShape | null
  getOps: () => TextOp[]
  getAttributesAtCursor: () => Attributes.Map
  updateSelection: (selection: SelectionShape) => void
  clearTimeout: () => void
  setTimeout: (callback: () => void, duration: number) => void
}

export interface TextChangeSessionBehavior {
  handleOnTextChanged: (owner: TextChangeSessionOwner, nextText: string) => void
  handleOnSelectionChanged: (
    owner: TextChangeSessionOwner,
    event: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
  ) => void
}

function applySelectionChange(owner: TextChangeSessionOwner, textChangeSession: TextChangeSession) {
  const ops = owner.getOps()
  const documentDeltaUpdate = new DocumentDelta(ops).applyTextDiff(
    textChangeSession.getTextAfterChange(),
    textChangeSession.getDeltaChangeContext(),
    owner.getAttributesAtCursor(),
  )
  owner.setTextChangeSession(null)
  owner.updateOps(documentDeltaUpdate)
}

const IOS_TIMEOUT_DURATION = 10

/**
 * As of RN61 on iOS, selection changes happens before text change.
 */
export const iosTextChangeSessionBehavior: TextChangeSessionBehavior = {
  handleOnSelectionChanged(owner, { nativeEvent: { selection } }) {
    owner.clearTimeout()
    const textChangeSession = new TextChangeSession()
    textChangeSession.setSelectionBeforeChange(owner.getBlockScopedSelection() as SelectionShape)
    textChangeSession.setSelectionAfterChange(selection)
    owner.setTextChangeSession(textChangeSession)
    owner.setTimeout(() => {
      owner.setTextChangeSession(null)
      owner.updateSelection(selection)
    }, IOS_TIMEOUT_DURATION)
  },
  handleOnTextChanged(owner, nextText) {
    owner.clearTimeout()
    const textChangeSession = owner.getTextChangeSession()
    if (textChangeSession !== null) {
      textChangeSession.setTextAfterChange(nextText)
      applySelectionChange(owner, textChangeSession)
    }
  },
}

/**
 * As of RN61 on Android, text changes happens before selection change.
 */
export const androidTextChangeSessionBehavior: TextChangeSessionBehavior = {
  handleOnTextChanged(owner, nextText) {
    const textChangeSession = new TextChangeSession()
    textChangeSession.setTextAfterChange(nextText)
    textChangeSession.setSelectionBeforeChange(owner.getBlockScopedSelection() as Selection)
    owner.setTextChangeSession(textChangeSession)
  },
  handleOnSelectionChanged(owner, { nativeEvent: { selection } }) {
    const nextSelection = Selection.between(selection.start, selection.end)
    const textChangeSession = owner.getTextChangeSession()
    if (textChangeSession !== null) {
      textChangeSession.setSelectionAfterChange(nextSelection)
      applySelectionChange(owner, textChangeSession)
    } else {
      owner.updateSelection(nextSelection)
    }
  },
}
