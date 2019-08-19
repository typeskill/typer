import React, { Component } from 'react'
import invariant from 'invariant'
import {
  View,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  StyleSheet,
  TextInputProps,
  TextInputSelectionChangeEventData,
} from 'react-native'
import { RichText, richTextStyles } from '@components/RichText'
import { Orchestrator } from '@model/Orchestrator'
import { boundMethod } from 'autobind-decorator'
import { TextBlockControllerProps, TextBlockControllerState, SyncSubject } from './types'
import { Synchronizer } from './Synchronizer'
import PCancelable from 'p-cancelable'
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
 * Read the {@link Synchronizer} documentation to understand the implementation challenges of this component.
 */
export class TextBlockController extends Component<TextBlockControllerProps, TextBlockControllerState>
  implements SyncSubject {
  private textInputRef: TextInput | null = null
  private synchronizer: Synchronizer

  public state: TextBlockControllerState = {
    isControlingState: false,
    overridingSelection: null,
    richContent: null,
    disableEdition: false,
  }

  public constructor(props: TextBlockControllerProps) {
    super(props)
    invariant(props.block != null, INVARIANT_MANDATORY_TEXT_BLOCK_PROP)
    this.synchronizer = new Synchronizer(this)
  }

  private get blockControllerInterface(): Orchestrator.BlockControllerInterface {
    return this.props.block.getControllerInterface()
  }

  @boundMethod
  private handleOnSheetDomainTextChanged(text: string) {
    this.synchronizer.handleOnSheetDomainTextChanged(text)
  }

  @boundMethod
  private async handleOnSheetDomainSelectionChange(e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    return this.synchronizer.handleOnSheetDomainSelectionChange(e)
  }

  @boundMethod
  private handleControlDomainContentChange(contentChange: DocumentDeltaAtomicUpdate) {
    this.synchronizer.handleControlDomainContentChange(contentChange)
  }

  @boundMethod
  private handleOnTextinputRef(ref: TextInput | null) {
    this.textInputRef = ref
  }

  @boundMethod
  private handleOnKeyPressed({ nativeEvent: { key } }: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    this.getTextBlock().handleOnKeyPress(key)
  }

  @boundMethod
  private handleOnFocusRequest() {
    this.textInputRef && this.textInputRef.focus()
  }

  public getTextBlock() {
    return this.props.block
  }

  public async setStateAsync(stateFragment: Partial<TextBlockControllerState>): PCancelable<void> {
    return new PCancelable(res => {
      this.setState(stateFragment as TextBlockControllerState, res)
    })
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
    this.blockControllerInterface.addListener('FOCUS_REQUEST', this.handleOnFocusRequest)
    this.blockControllerInterface.addListener('CONTROL_DOMAIN_CONTENT_CHANGE', this.handleControlDomainContentChange)
  }

  public componentDidUpdate(_oldProps: TextBlockControllerProps, oldState: TextBlockControllerState) {
    // We must change the state to null to avoid forcing selection in TextInput component.
    if (this.state.overridingSelection) {
      this.setState({ overridingSelection: null })
    }
    if (oldState.richContent !== this.state.richContent && this.state.richContent) {
      console.info(`UPDATES RICH CONTENT ${JSON.stringify(this.state.richContent.ops, null, 2)}`)
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
    const { grow, textStyle, block: textBlock } = this.props
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
          onSelectionChange={this.handleOnSheetDomainSelectionChange}
          onChangeText={this.handleOnSheetDomainTextChanged}
          ref={this.handleOnTextinputRef}
          {...constantTextInputProps}
        >
          {textComponent}
        </TextInput>
      </View>
    )
  }
}
