import DocumentDelta from '@delta/DocumentDelta'
import React, { Component } from 'react'
import invariant from 'invariant'
import { View, Text, TextInput, NativeSyntheticEvent, TextInputSelectionChangeEventData, TextInputKeyPressEventData, StyleSheet, StyleProp, TextStyle, TextInputProps } from 'react-native'
import RichText, { richTextStyles } from '@components/RichText'
import { Selection } from '@delta/selection'
import Orchestrator from '@model/Orchestrator'
import { boundMethod } from 'autobind-decorator'
import TextBlock from '@model/TextBlock'
import slice from 'ramda/es/slice'
import concat from 'ramda/es/concat'
import { TextChangeSession } from './TextChangeSession'

export interface TextBlockControllerProps<T extends string> {
  documentDelta: DocumentDelta
  textBlock: TextBlock<T>
  grow?: boolean
  textStyle?: StyleProp<TextStyle>
}

interface TextBlockControllerState {
  isControlingState: boolean
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
  private selection: Selection = {
    start: 0,
    end: 0
  }

  state: TextBlockControllerState = {
    isControlingState: false
  }

  constructor(props: TextBlockControllerProps<T>) {
    super(props)
    invariant(props.textBlock != null, 'model prop must be given at construction')
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

  @boundMethod
  private handleOnSubmitEditing() {
    this.props.textBlock.handleOnSubmitEditing()
  }

  /**
   * **Preconditions**: this method must be called after handleOnTextChanged
   * 
   * @param textInputSelectionChangeEvent 
   */
  @boundMethod
  private handleOnSelectionChange({ nativeEvent: { selection } }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    const { textBlock } = this.props
    if (!this.state.isControlingState) {
      this.selection = selection
      this.props.textBlock.handleOnSelectionChange(selection)
    }
    if (this.textChangeSession !== null) {
      this.textChangeSession.setSelectionAfterChange(selection)
      textBlock.handleOnTextChange(this.textChangeSession.getTextAfterChange(), this.textChangeSession.getDeltaChangeContext())
      this.textChangeSession = null
    }
  }

  @boundMethod
  private handleOnSelectionRangeAttributesUpdate() {
    // This is to prevent selection changes from clearing selection after
    // applying new attributes.
    this.setState({ isControlingState: true }, () => {
      const timeout = setTimeout(() => {
        this.setState({ isControlingState: false })
      }, 75)
      this.timeouts.push(timeout)
    })
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
  }

  componentWillUnmount() {
    this.blockControllerInterface.release()
    for (const timeout of this.timeouts) {
      clearTimeout(timeout)
    }
  }

  render() {
    const { grow, documentDelta, textStyle, textBlock } = this.props
    const { isControlingState } = this.state
    return (
      <View style={[grow ? styles.grow : undefined]}>
        <TextInput selection={isControlingState ? this.selection : undefined}
                   style={[grow ? styles.grow : undefined, styles.textInput, richTextStyles.defaultText, { backgroundColor: 'rgb(240,240,240)' }]}
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
