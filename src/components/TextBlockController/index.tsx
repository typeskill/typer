import React, { Component } from 'react'
import invariant from 'invariant'
import { View, TextInput, NativeSyntheticEvent, TextInputSelectionChangeEventData, TextInputKeyPressEventData, StyleSheet, StyleProp, TextStyle, TextInputProps, InteractionManager } from 'react-native'
import RichText, { richTextStyles } from '@components/RichText'
import { Selection } from '@delta/Selection'
import Orchestrator from '@model/Orchestrator'
import { boundMethod } from 'autobind-decorator'
import TextBlock from '@model/TextBlock'
import { TextChangeSession } from './TextChangeSession'
import { GenericOp } from '@delta/operations'
import debounce from 'lodash.debounce'
import { Cancelable } from 'lodash'
import { DocumentDeltaUpdate } from '@delta/DocumentDeltaUpdate'

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

export const REACT_MINIMAL_INTERVAL_FOR_UPDATE = 30
export const TIME_TO_AGGREGATE_TEXT_CHANGES = 100

const debounceByTimeToAggregate = <T extends (...args: any) => any>(fn: T) => debounce(fn, TIME_TO_AGGREGATE_TEXT_CHANGES, {
  leading: false,
  trailing: true
})

export default class TextBlockController<T extends string> extends Component<TextBlockControllerProps<T>, TextBlockControllerState> {

  private textInputRef: TextInput | null = null
  private textChangeSession: TextChangeSession|null = null
  private selection = Selection.fromBounds(0)

  state: TextBlockControllerState = {
    isControlingState: false,
    overridingSelection: null,
    ops: null
  }

  constructor(props: TextBlockControllerProps<T>) {
    super(props)
    invariant(props.textBlock != null, 'textBlock prop must be given at construction')
    this.handleOnTextChanged = debounceByTimeToAggregate(this.handleOnTextChanged).bind(this)
    this.handleOnSelectionChange = debounceByTimeToAggregate(this.handleOnSelectionChange).bind(this)
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

  private handleOnSelectionChange(selection: { start: number, end: number }) {
    const { textBlock } = this.props
    const nextSelection = Selection.between(selection.start, selection.end)
    if (this.textChangeSession !== null) {
      this.textChangeSession.setSelectionAfterChange(nextSelection)
      textBlock.handleOnTextChange(this.textChangeSession.getTextAfterChange(), this.textChangeSession.getDeltaChangeContext())
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
  private handleOnSelectionChangeEvent({ nativeEvent: { selection } }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    this.handleOnSelectionChange(selection)
  }

  @boundMethod
  private handleOnFocusRequest() {
    this.textInputRef && this.textInputRef.focus()
  }

  private async setStateAsync(state: Partial<TextBlockControllerState>, delay?: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.setState(state as any, () => {
          console.info('SETTING STATE', JSON.stringify(state))
          resolve()
        })
      }, delay || 0)
    })
  }

  @boundMethod
  private async handleOnDeltaUpdate(documentDeltaUpdate: DocumentDeltaUpdate) {
    // The reason for passing two deltas during two distinct state updates
    // is related to how updates work in React.
    // By just passing the result of text diff and normalization, we could run into
    // a bug when normalized delta strictly equals the delta preceding text diff.
    // In such cases, passing normalized prop wouldn't result in a component tree update.
    const nextDocDeltaOps = documentDeltaUpdate.nextDocumentDelta.ops
    const normalizedDeltaOps = documentDeltaUpdate.normalizedDelta.ops
    const overridingSelection = documentDeltaUpdate.overridingSelection
    await this.setStateAsync({ ops: nextDocDeltaOps })
    console.info('SHOULD APPLY NORM', documentDeltaUpdate.shouldApplyNormalization())
    if (documentDeltaUpdate.shouldApplyNormalization()) {
      await this.setStateAsync({ ops: normalizedDeltaOps })
    }
    if (overridingSelection) {
      // We must wait for interactions, otherwise the TextInput setSpan bug arise.
      await InteractionManager.runAfterInteractions(() => {
        console.info('OVERRIDING SELECTION')
        return this.setStateAsync({ overridingSelection })
      })
    }
  }

  shouldComponentUpdate(nextProps: TextBlockControllerProps<T>, nextState: TextBlockControllerState) {
    return nextState.ops !== this.state.ops ||
           nextProps.grow !== this.props.grow ||
           nextState.isControlingState !== this.state.isControlingState ||
           nextState.overridingSelection !== this.state.overridingSelection
  }

  componentDidMount() {
    this.blockControllerInterface.addListener('DELTA_UPDATE', this.handleOnDeltaUpdate)
    this.blockControllerInterface.addListener('FOCUS_REQUEST', this.handleOnFocusRequest)
  }

  componentDidUpdate() {
    // We must change the state to null to avoid forcing selection
    // to TextInput component.
    if (this.state.overridingSelection) {
      // Won't trigger rerender thanks to shouldComponentUpdate
      this.setState({ overridingSelection: null })
    }
  }

  componentWillUnmount() {
    this.blockControllerInterface.release();
    (this.handleOnTextChanged as unknown as Cancelable).cancel();
    (this.handleOnSelectionChange as unknown as Cancelable).cancel()
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
                   onSelectionChange={this.handleOnSelectionChangeEvent}
                   onChangeText={this.handleOnTextChanged}
                   ref={this.handleOnTextinputRef}
                   {...constantTextInputProps}>
          {textComponent}
        </TextInput>
      </View>
    )
  }
}
