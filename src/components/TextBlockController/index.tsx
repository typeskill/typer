import DocumentDelta from '@delta/DocumentDelta'
import React, { Component } from 'react'
import invariant from 'invariant'
import { View, TextInput, NativeSyntheticEvent, TextInputSelectionChangeEventData, TextInputKeyPressEventData, StyleSheet, StyleProp, TextStyle, TextInputProps } from 'react-native'
import RichText, { richTextStyles } from '@components/RichText'
import { Selection } from '@delta/Selection'
import Orchestrator from '@model/Orchestrator'
import { boundMethod } from 'autobind-decorator'
import TextBlock from '@model/TextBlock'
import { TextChangeSession } from './TextChangeSession'
import { GenericOp } from '@delta/operations'

export interface TextBlockControllerProps<T extends string> {
  textBlock: TextBlock<T>
  grow?: boolean
  textStyle?: StyleProp<TextStyle>
}

interface TextBlockControllerState {
  isControlingState: boolean
  overridingSelection: Selection|null
  ops: GenericOp[]|null
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

  private textInputRef: TextInput | null = null
  private timeouts: NodeJS.Timeout[] = []
  private textChangeSession: TextChangeSession|null = null
  private nextOverridingSelection: Selection|null = null
  private skipNextSelectionUpdate: boolean = false
  private selection = Selection.fromBounds(0)

  state: TextBlockControllerState = {
    isControlingState: false,
    overridingSelection: null,
    ops: null
  }

  constructor(props: TextBlockControllerProps<T>) {
    super(props)
    invariant(props.textBlock != null, 'textBlock prop must be given at construction')
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
    const nextSelection = !this.skipNextSelectionUpdate ? Selection.fromObject(selection) : this.selection
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

  @boundMethod
  private handleOnDeltaUpdate(delta: DocumentDelta) {
    this.setState({ ops: delta.ops })
  }

  shouldComponentUpdate(nextProps: TextBlockControllerProps<T>, nextState: TextBlockControllerState) {
    return nextState.ops !== this.state.ops ||
           nextProps.grow !== this.props.grow ||
           nextState.isControlingState !== this.state.isControlingState
  }

  componentDidMount() {
    this.blockControllerInterface.addListener('DELTA_UPDATE', this.handleOnDeltaUpdate)
    this.blockControllerInterface.addListener('SELECTION_RANGE_ATTRIBUTES_UPDATE', this.handleOnSelectionRangeAttributesUpdate)
    this.blockControllerInterface.addListener('FOCUS_REQUEST', this.handleOnFocusRequest)
    this.blockControllerInterface.addListener('SELECTION_OVERRIDE', this.handleOnSelectionOverride)
  }

  getSnapshotBeforeUpdate(_prevProps: TextBlockControllerProps<T>, prevState: TextBlockControllerState) {
    if (this.state.ops !== prevState.ops && this.nextOverridingSelection) {
      const selection = this.nextOverridingSelection
      this.nextOverridingSelection = null
      return selection
    }
    return null
  }

  componentDidUpdate(prevProps: TextBlockControllerProps<T>, _prevState: TextBlockControllerState, overridingSelection: Selection|null) {
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
    const { grow, textStyle, textBlock } = this.props
    const { overridingSelection, ops: documentDelta } = this.state
    const textComponent = documentDelta ? (
      <RichText textStyle={textStyle} textTransformsReg={textBlock.getTextTransformsRegistry()} ops={documentDelta} />
    ) : null
    return (
      <View style={[grow ? styles.grow : undefined]}>
        <TextInput selection={overridingSelection ? overridingSelection : undefined}
                   style={[grow ? styles.grow : undefined, styles.textInput, richTextStyles.defaultText]}
                   onKeyPress={this.handleOnKeyPressed}
                   onSelectionChange={this.handleOnSelectionChange}
                   onChangeText={this.handleOnTextChanged}
                   ref={this.handleOnTextinputRef}
                   {...constantTextInputProps}>
          {textComponent}
        </TextInput>
      </View>
    )
  }
}
