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
import { DocumentDeltaUpdate } from '@delta/DocumentDeltaUpdate'
import { TextBlockControllerProps, TextBlockControllerState, TextBlockMinimalComponent } from './types'
import { TextBlockUpdateSynchronizer } from './TextBlockUpdateSynchronizer'

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

export class TextBlockController extends Component<TextBlockControllerProps, TextBlockControllerState> {
  private textInputRef: TextInput | null = null
  private textChangeSession: TextChangeSession | null = null
  private selection = Selection.fromBounds(0)
  private synchronizer: TextBlockUpdateSynchronizer

  public state: TextBlockControllerState = {
    isControlingState: false,
    overridingSelection: null,
    ops: null,
  }

  public constructor(props: TextBlockControllerProps) {
    super(props)
    invariant(props.textBlock != null, INVARIANT_MANDATORY_TEXT_BLOCK_PROP)
    this.synchronizer = new TextBlockUpdateSynchronizer(this as TextBlockMinimalComponent)
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
  private async handleOnDeltaUpdate(documentDeltaUpdate: DocumentDeltaUpdate) {
    return this.synchronizer.handleFragmentedUpdate(documentDeltaUpdate)
  }

  public shouldComponentUpdate(nextProps: TextBlockControllerProps, nextState: TextBlockControllerState) {
    return (
      nextState.ops !== this.state.ops ||
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
    const { overridingSelection, ops: documentDelta } = this.state
    const textComponent = documentDelta ? (
      <RichText textStyle={textStyle} textTransformsReg={textBlock.getTextTransformsRegistry()} ops={documentDelta} />
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
