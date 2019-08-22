import React, { Component } from 'react'
import invariant from 'invariant'
import {
  View,
  TextInput,
  NativeSyntheticEvent,
  StyleSheet,
  TextInputProps,
  TextInputSelectionChangeEventData,
  TextInputKeyPressEventData,
  StyleProp,
  TextStyle,
} from 'react-native'
import { RichText, richTextStyles } from '@components/RichText'
import { boundMethod } from 'autobind-decorator'
import PCancelable from 'p-cancelable'
import { SyncSubject } from './Synchronizer'
import { Selection } from '@delta/Selection'
import { TextOp } from '@delta/operations'
import { Attributes } from '@delta/attributes'
import { Transforms } from '@core/Transforms'
import { DocumentContent } from '@model/document'
import { TextChangeSession } from './TextChangeSession'
import { DocumentDelta } from '@delta/DocumentDelta'

const styles = StyleSheet.create({
  grow: {
    flex: 1,
  },
  textInput: {
    textAlignVertical: 'top',
  },
})

export interface TextBlockControllerProps {
  textOps: TextOp[]
  textAttributesAtCursor: Attributes.Map
  grow?: boolean
  textStyle?: StyleProp<TextStyle>
  isFocused: boolean
  updateScopedContent: (scopedContent: Partial<DocumentContent>) => Promise<void>
  textTransforms: Transforms
}

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

interface TextBlockControllerState {
  overridingSelection: Selection | null
}

/**
 * A component which is responsible for providing a user interface to edit {@link RichContent}.
 *
 * @privateRemarks
 *
 * Read the {@link Synchronizer} documentation to understand the implementation challenges of this component.
 */
export class TextBlockController extends Component<TextBlockControllerProps, TextBlockControllerState> {
  private textChangeSession: TextChangeSession | null = null
  private textInputRef: TextInput | null = null
  private currentSelection = Selection.fromShape({ start: 0, end: 0 })

  public state: TextBlockControllerState = {
    overridingSelection: null,
  }

  public constructor(props: TextBlockControllerProps) {
    super(props)
    invariant(props.textOps != null, INVARIANT_MANDATORY_TEXT_BLOCK_PROP)
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
    this.textChangeSession.setSelectionBeforeChange(this.currentSelection)
  }

  @boundMethod
  private handleOnSelectionChanged({
    nativeEvent: { selection },
  }: NativeSyntheticEvent<TextInputSelectionChangeEventData>) {
    const nextSelection = Selection.between(selection.start, selection.end)
    if (this.textChangeSession !== null) {
      this.textChangeSession.setSelectionAfterChange(nextSelection)
      const ops = this.props.textOps
      const documentDeltaUpdate = new DocumentDelta(ops).applyTextDiff(
        this.textChangeSession.getTextAfterChange(),
        this.textChangeSession.getDeltaChangeContext(),
        this.props.textAttributesAtCursor,
      )
      console.info('DELTA CHANGE CONTEXT', this.textChangeSession.getDeltaChangeContext())
      this.textChangeSession = null
      this.updateOps(documentDeltaUpdate.delta.ops as TextOp[], documentDeltaUpdate.selectionAfterChange)
    } else {
      this.updateSelection(nextSelection)
    }
  }

  @boundMethod
  private handleOnTextinputRef(ref: TextInput | null) {
    this.textInputRef = ref
  }

  @boundMethod
  private handleOnFocusRequest() {
    this.textInputRef && this.textInputRef.focus()
  }

  private async setStateAsync(stateFragment: Partial<TextBlockControllerState>): PCancelable<void> {
    return new PCancelable(res => {
      this.setState(stateFragment as TextBlockControllerState, res)
    })
  }

  public shouldComponentUpdate(nextProps: TextBlockControllerProps, nextState: TextBlockControllerState) {
    return (
      nextProps.grow !== this.props.grow ||
      nextState.overridingSelection !== this.state.overridingSelection ||
      nextProps.textOps !== this.props.textOps ||
      nextProps.isFocused !== this.props.isFocused
    )
  }

  public async updateSelection(currentSelection: Selection) {
    this.currentSelection = currentSelection
    return this.props.updateScopedContent({ currentSelection })
  }

  public getTextAttributesAtCursor() {
    return this.props.textAttributesAtCursor
  }

  private updateOps(textOps: TextOp[], currentSelection: Selection) {
    this.currentSelection = currentSelection
    return this.props.updateScopedContent({ currentSelection, ops: textOps })
  }

  public overrideSelection(overridingSelection: Selection) {
    return this.setStateAsync({ overridingSelection })
  }

  public getCurrentSelection() {
    return this.currentSelection
  }

  public getOps() {
    return this.props.textOps
  }

  public handleOnKeyPressed(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    console.log(e.nativeEvent.key)
  }

  public componentDidUpdate(oldProps: TextBlockControllerProps) {
    // We must change the state to null to avoid forcing selection in TextInput component.
    if (this.state.overridingSelection) {
      this.setState({ overridingSelection: null })
    }
    if (!oldProps.isFocused && this.props.isFocused) {
      this.handleOnFocusRequest()
    }
  }

  public componentDidCatch(error: {}, info: {}) {
    console.warn(error, info)
  }

  public render() {
    const { grow, textStyle, textOps, textTransforms } = this.props
    const { overridingSelection } = this.state
    return (
      <View style={[grow ? styles.grow : undefined]}>
        <TextInput
          selection={overridingSelection ? overridingSelection : undefined}
          style={[grow ? styles.grow : undefined, styles.textInput, richTextStyles.defaultText]}
          onKeyPress={this.handleOnKeyPressed}
          onSelectionChange={this.handleOnSelectionChanged}
          onChangeText={this.handleOnTextChanged}
          ref={this.handleOnTextinputRef}
          {...constantTextInputProps}
        >
          <RichText textStyle={textStyle} transforms={textTransforms} textOps={textOps} />
        </TextInput>
      </View>
    )
  }
}
