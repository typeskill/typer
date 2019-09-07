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
import { Selection } from '@delta/Selection'
import { TextOp } from '@delta/operations'
import { Attributes } from '@delta/attributes'
import { Transforms } from '@core/Transforms'
import { TextChangeSession } from './TextChangeSession'
import { DocumentDelta } from '@delta/DocumentDelta'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'
import { StandardBlockInputProps } from '../types'

const styles = StyleSheet.create({
  grow: {
    flex: 1,
  },
  textInput: {
    textAlignVertical: 'top',
  },
})

export interface TextBlockInputProps extends StandardBlockInputProps {
  textOps: TextOp[]
  textAttributesAtCursor: Attributes.Map
  textStyle?: StyleProp<TextStyle>
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

/**
 * A component which is responsible for providing a user interface to edit {@link RichContent}.
 *
 */
export class TextBlockInput extends Component<TextBlockInputProps> {
  private textChangeSession: TextChangeSession | null = null
  private textInputRef = React.createRef<TextInput>()
  private blockScopedSelection = Selection.fromShape({ start: 0, end: 0 })

  public constructor(props: TextBlockInputProps) {
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
    this.textChangeSession.setSelectionBeforeChange(this.blockScopedSelection)
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
      this.textChangeSession = null
      this.updateOps(documentDeltaUpdate)
    } else {
      this.updateSelection(nextSelection)
    }
  }

  @boundMethod
  private focus() {
    this.textInputRef.current && this.textInputRef.current.focus()
  }

  @boundMethod
  private handleOnFocus() {
    this.updateSelection(this.blockScopedSelection)
  }

  public shouldComponentUpdate(nextProps: TextBlockInputProps) {
    return (
      nextProps.overridingScopedSelection !== this.props.overridingScopedSelection ||
      nextProps.textOps !== this.props.textOps ||
      nextProps.isFocused !== this.props.isFocused
    )
  }

  public async updateSelection(currentSelection: Selection) {
    this.blockScopedSelection = currentSelection
    return this.props.controller.updateSelectionInBlock(currentSelection)
  }

  private updateOps(documentDeltaUpdate: DocumentDeltaAtomicUpdate) {
    this.blockScopedSelection = documentDeltaUpdate.selectionAfterChange
    return this.props.controller.applyDiffInBlock(documentDeltaUpdate.diff)
  }

  public getCurrentSelection() {
    return this.blockScopedSelection
  }

  public getOps() {
    return this.props.textOps
  }

  @boundMethod
  public handleOnKeyPressed(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    const key = e.nativeEvent.key
    if (key === 'Backspace' && this.blockScopedSelection.start === 0 && this.blockScopedSelection.end === 0) {
      this.props.controller.removeOneBeforeBlock()
    }
  }

  public componentDidMount() {
    if (this.props.isFocused) {
      this.focus()
    }
  }

  public componentDidUpdate(oldProps: TextBlockInputProps) {
    if (this.props.isFocused && !oldProps.isFocused) {
      setTimeout(this.focus, 0)
    }
    if (this.props.overridingScopedSelection !== null) {
      this.blockScopedSelection = Selection.fromShape(this.props.overridingScopedSelection)
    }
  }

  public componentDidCatch(error: {}, info: {}) {
    console.warn(error, info)
  }

  public render() {
    const { textStyle, textOps, textTransforms, overridingScopedSelection: overridingSelection } = this.props
    return (
      <View style={styles.grow}>
        <TextInput
          selection={overridingSelection ? overridingSelection : undefined}
          style={[styles.grow, styles.textInput, richTextStyles.defaultText]}
          onKeyPress={this.handleOnKeyPressed}
          onSelectionChange={this.handleOnSelectionChanged}
          onChangeText={this.handleOnTextChanged}
          onFocus={this.handleOnFocus}
          ref={this.textInputRef}
          {...constantTextInputProps}
        >
          <RichText textStyle={textStyle} transforms={textTransforms} textOps={textOps} />
        </TextInput>
      </View>
    )
  }
}
