import React, { Component } from 'react'
import invariant from 'invariant'
import {
  View,
  TextInput,
  NativeSyntheticEvent,
  TextInputSelectionChangeEventData,
  TextInputKeyPressEventData,
  StyleSheet,
  TextInputProps,
} from 'react-native'
import { RichText, richTextStyles } from '@components/RichText'
import { Selection } from '@delta/Selection'
import { Orchestrator } from '@model/Orchestrator'
import { boundMethod } from 'autobind-decorator'
import { TextChangeSession } from './TextChangeSession'
import { DocumentDeltaSerialUpdate } from '@delta/DocumentDeltaSerialUpdate'
import { TextBlockControllerProps, TextBlockControllerState, TextBlockSyncInterface } from './types'
import { TextBlockUpdateSynchronizer } from './TextBlockUpdateSynchronizer'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'

export { TextBlockControllerProps }

const styles = StyleSheet.create({
  grow: {
    flex: 1,
  },
  textInput: {
    textAlignVertical: 'top',
  },
})

export const INVARIANT_MANDATORY_TEXT_BLOCK_PROP = 'textBlock prop is mandatory'

// eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
const constantTextInputProps: TextInputProps = {
  disableFullscreenUI: true,
  scrollEnabled: false,
  multiline: true,
  returnKeyType: 'next',
  keyboardType: 'default',
  textBreakStrategy: 'highQuality',
  importantForAutofill: 'noExcludeDescendants',
  blurOnSubmit: false,
} as TextInputProps

/**
 * A component which is responsible for providing a user interface to edit {@link RichContent}.
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
 * and the data necessary to perform such is encapsulated in {@link DocumentDeltaSerialUpdate} class.
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
 *
 * One solution could be to lock state during update. But that would prevent the user from typing; not acceptable for UX.
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
 * 1. compute a new *serial update* from the last applied delta
 * 2. ignore forthcoming atomic updates from the original *serial update*
 *
 */
export class TextBlockController extends Component<TextBlockControllerProps, TextBlockControllerState>
  implements TextBlockSyncInterface {
  private textInputRef: TextInput | null = null
  private textChangeSession: TextChangeSession | null = null
  private selection = Selection.fromBounds(0)
  private synchronizer: TextBlockUpdateSynchronizer

  public state: TextBlockControllerState = {
    isControlingState: false,
    overridingSelection: null,
    richContent: null,
  }

  public constructor(props: TextBlockControllerProps) {
    super(props)
    invariant(props.textBlock != null, INVARIANT_MANDATORY_TEXT_BLOCK_PROP)
    this.synchronizer = new TextBlockUpdateSynchronizer(this)
  }

  private get blockControllerInterface(): Orchestrator.BlockControllerInterface {
    return this.props.textBlock.getControllerInterface()
  }

  /**
   * **Preconditions**: this method must be called before handleOnSelectionChange
   * This is the current TextInput behavior.
   *
   * @param nextText
   */
  @boundMethod
  private handleOnTextChanged(nextText: string) {
    if (!this.synchronizer.isRunning()) {
      this.textChangeSession = new TextChangeSession()
      this.textChangeSession.setTextAfterChange(nextText)
      this.textChangeSession.setSelectionBeforeChange(this.selection)
    }
  }

  @boundMethod
  private handleOnTextinputRef(ref: TextInput | null) {
    this.textInputRef = ref
  }

  @boundMethod
  private handleOnKeyPressed({ nativeEvent: { key } }: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    this.props.textBlock.handleOnKeyPress(key)
  }

  @boundMethod
  private handleOnSelectionChange(selection: { start: number; end: number }) {
    const { textBlock } = this.props
    const nextSelection = Selection.between(selection.start, selection.end)
    if (this.textChangeSession !== null) {
      this.textChangeSession.setSelectionAfterChange(nextSelection)
      textBlock.handleOnTextChange(
        this.textChangeSession.getTextAfterChange(),
        this.textChangeSession.getDeltaChangeContext(),
      )
      this.textChangeSession = null
    }
    this.selection = nextSelection
    this.props.textBlock.handleOnSelectionChange(nextSelection)
    this.forceUpdate()
  }

  /**
   * **Preconditions**: this method must be called after handleOnTextChanged
   *
   * @param textInputSelectionChangeEvent
   */
  @boundMethod
  private handleOnSelectionChangeEvent({
    nativeEvent: { selection },
  }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    this.handleOnSelectionChange(selection)
  }

  @boundMethod
  private handleOnFocusRequest() {
    this.textInputRef && this.textInputRef.focus()
  }

  @boundMethod
  private async handleOnDeltaUpdate(documentDeltaUpdate: DocumentDeltaSerialUpdate) {
    return this.synchronizer.handleFragmentedUpdate(documentDeltaUpdate)
  }

  public shouldComponentUpdate(nextProps: TextBlockControllerProps, nextState: TextBlockControllerState) {
    return (
      nextState.richContent !== this.state.richContent ||
      nextProps.grow !== this.props.grow ||
      nextState.isControlingState !== this.state.isControlingState ||
      nextState.overridingSelection !== this.state.overridingSelection
    )
  }

  public componentDidMount() {
    this.blockControllerInterface.addListener('DELTA_UPDATE', this.handleOnDeltaUpdate)
    this.blockControllerInterface.addListener('FOCUS_REQUEST', this.handleOnFocusRequest)
  }

  public componentDidUpdate() {
    // We must change the state to null to avoid forcing selection in TextInput component.
    if (this.state.overridingSelection) {
      this.setState({ overridingSelection: null })
    }
  }

  public componentDidCatch(error: {}, info: {}) {
    console.warn(error, info)
  }

  public componentWillUnmount() {
    this.synchronizer.release()
    this.blockControllerInterface.release()
  }

  public render() {
    const { grow, textStyle, textBlock } = this.props
    const { overridingSelection, richContent } = this.state
    const textComponent = richContent ? (
      <RichText textStyle={textStyle} transforms={textBlock.getTextTransformsRegistry()} richContent={richContent} />
    ) : null
    return (
      <View style={[grow ? styles.grow : undefined]}>
        <TextInput
          selection={overridingSelection ? overridingSelection : undefined}
          style={[grow ? styles.grow : undefined, styles.textInput, richTextStyles.defaultText]}
          onKeyPress={this.handleOnKeyPressed}
          onSelectionChange={this.handleOnSelectionChangeEvent}
          onChangeText={this.handleOnTextChanged}
          ref={this.handleOnTextinputRef}
          {...constantTextInputProps}
        >
          {textComponent}
        </TextInput>
      </View>
    )
  }
}
