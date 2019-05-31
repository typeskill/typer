import DocumentDelta from '@delta/DocumentDelta'
import React, { Component } from 'react'
import invariant from 'invariant'
import { View, TextInput, NativeSyntheticEvent, TextInputSelectionChangeEventData, TextInputKeyPressEventData, StyleSheet, StyleProp, TextStyle, TextInputProps } from 'react-native'
import RichText, { richTextStyles } from '@components/RichText'
import { Selection } from '@delta/selection'
import Orchestrator from '@model/Orchestrator'
import { boundMethod } from 'autobind-decorator'
import TextBlock from '@model/TextBlock'
import { TextChangeSession } from './TextChangeSession'

export interface TextBlockControllerProps<T extends string> {
  documentDelta: DocumentDelta
  textBlock: TextBlock<T>
  grow?: boolean
  textStyle?: StyleProp<TextStyle>
}

interface TextBlockControllerState {
  isControlingState: boolean
  overridingSelection: Selection|null
}

const styles = StyleSheet.create({
  grow: {
    flex: 1
  },
  textInput: {
    textAlignVertical: 'top'
  }
})

const constantTextInputProps = {
  disableFullscreenUI: true,
  scrollEnabled: false,
  multiline: true,
  returnKeyType: 'next',
  keyboardType: 'default',
  textBreakStrategy: 'highQuality',
  importantForAutofill: 'noExcludeDescendants',
  blurOnSubmit: false
} as TextInputProps

export default class TextBlockController<T extends string> extends Component<TextBlockControllerProps<T>, TextBlockControllerState> {

  private blockControllerInterface: Orchestrator.BlockControllerInterface
  private textInputRef: TextInput | null = null
  private timeouts: NodeJS.Timeout[] = []
  private textChangeSession: TextChangeSession|null = null
  private nextOverridingSelection: Selection|null = null
  private skipNextSelectionUpdate: boolean = false
  private selection: Selection = {
    start: 0,
    end: 0
  }

  state: TextBlockControllerState = {
    isControlingState: false,
    overridingSelection: null
  }

  constructor(props: TextBlockControllerProps<T>) {
    super(props)
    invariant(props.textBlock != null, 'textBlock prop must be given at construction')
    this.blockControllerInterface = props.textBlock.getControllerInterface()
  }

  /**
   * **Preconditions**: this method must be called before handleOnSelectionChange
   * This is the current TextInput behavior.
   * 
   * @param nextText 
   */
  @boundMethod
  private handleOnTextChanged(nextText: string) {
    this.textChangeSession = new TextChangeSession()
    this.textChangeSession.setTextAfterChange(nextText)
    this.textChangeSession.setSelectionBeforeChange(this.selection)
  }

  @boundMethod
  private handleOnTextinputRef(ref: TextInput|null) {
    this.textInputRef = ref
  }

  @boundMethod
  private handleOnKeyPressed({ nativeEvent: { key } }: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    this.props.textBlock.handleOnKeyPress(key)
  }

  /**
   * **Preconditions**: this method must be called after handleOnTextChanged
   * 
   * @param textInputSelectionChangeEvent 
   */
  @boundMethod
  private handleOnSelectionChange({ nativeEvent: { selection } }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    const { textBlock } = this.props
    const nextSelection = !this.skipNextSelectionUpdate ? selection : this.selection
    if (this.textChangeSession !== null) {
      this.textChangeSession.setSelectionAfterChange(nextSelection)
      textBlock.handleOnTextChange(this.textChangeSession.getTextAfterChange(), this.textChangeSession.getDeltaChangeContext())
      this.textChangeSession = null
    }
    if (!this.skipNextSelectionUpdate) {
      this.selection = nextSelection
      this.props.textBlock.handleOnSelectionChange(nextSelection)
      // Forcing update because selection must be reset
      this.forceUpdate()
    } else {
      this.skipNextSelectionUpdate = false
      this.setState({ overridingSelection: nextSelection })
      this.forceUpdate()
    }
  }

  @boundMethod
  private handleOnSelectionOverride(selection: Selection) {
    this.nextOverridingSelection = selection
  }

  @boundMethod
  private handleOnSelectionRangeAttributesUpdate() {
    this.skipNextSelectionUpdate = true
  }

  @boundMethod
  private handleOnFocusRequest() {
    this.textInputRef && this.textInputRef.focus()
  }

  shouldComponentUpdate(nextProps: TextBlockControllerProps<T>, nextState: TextBlockControllerState) {
    return nextProps.documentDelta !== this.props.documentDelta ||
           nextProps.grow !== this.props.grow ||
           nextState.isControlingState !== this.state.isControlingState
  }

  componentDidMount() {
    this.blockControllerInterface.addListener('SELECTION_RANGE_ATTRIBUTES_UPDATE', this.handleOnSelectionRangeAttributesUpdate)
    this.blockControllerInterface.addListener('FOCUS_REQUEST', this.handleOnFocusRequest)
    this.blockControllerInterface.addListener('SELECTION_OVERRIDE', this.handleOnSelectionOverride)
  }

  getSnapshotBeforeUpdate(prevProps: TextBlockControllerProps<T>) {
    if (this.props.documentDelta !== prevProps.documentDelta && this.nextOverridingSelection) {
      const selection = this.nextOverridingSelection
      this.nextOverridingSelection = null
      return selection
    }
    return null
  }

  componentDidUpdate(_prevProps: TextBlockControllerProps<T>, _prevState: TextBlockControllerState, overridingSelection: Selection|null) {
    // Overriding selection during the same rendering cycle as
    // pushing the Text elements from delta into TextInput children props
    // triggers a setSpan exception.
    // 
    // We need to make sure this is rendered on next rendering cycle.
    // Because "componentDidUpdate" is called before flushing components
    // to native views, we must trigger a new rendering soon enough.
    //
    // The next rendering if forced with "forceUpdate".
    if (overridingSelection) {
      this.timeouts.push(setTimeout(() => {
        this.setState({ overridingSelection }, () => {
          this.forceUpdate()
        })
      }, 30))
    } else if (this.state.overridingSelection) {
      console.info('SETTING NULL')
      // Won't trigger rerender thanks to shouldComponentUpdate
      this.setState({ overridingSelection: null })
    }
  }

  componentWillUnmount() {
    this.blockControllerInterface.release()
    for (const timeout of this.timeouts) {
      clearTimeout(timeout)
    }
  }

  render() {
    const { grow, documentDelta, textStyle, textBlock } = this.props
    const { overridingSelection } = this.state
    return (
      <View style={[grow ? styles.grow : undefined]}>
        <TextInput selection={overridingSelection ? overridingSelection : undefined}
                   style={[grow ? styles.grow : undefined, styles.textInput, richTextStyles.defaultText]}
                   onKeyPress={this.handleOnKeyPressed}
                   onSelectionChange={this.handleOnSelectionChange}
                   onChangeText={this.handleOnTextChanged}
                   ref={this.handleOnTextinputRef}
                   {...constantTextInputProps}>
          <RichText textStyle={textStyle} textTransformsReg={textBlock.getTextTransformsRegistry()} documentDelta={documentDelta} />
        </TextInput>
      </View>
    )
  }
}
