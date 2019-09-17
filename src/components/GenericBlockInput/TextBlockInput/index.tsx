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
import { Selection, SelectionShape } from '@delta/Selection'
import { TextOp } from '@delta/operations'
import { Attributes } from '@delta/attributes'
import { Transforms } from '@core/Transforms'
import { TextChangeSession } from './TextChangeSession'
import { DocumentDelta } from '@delta/DocumentDelta'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'
import { StandardBlockInputProps } from '../types'
import { genericStyles } from '@components/styles'

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
  textTransformSpecs: Transforms.Specs
  blockScopedSelection: SelectionShape | null
}

export const INVARIANT_MANDATORY_TEXT_BLOCK_PROP = 'textBlock prop is mandatory'

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

interface State {
  overridingSelection: SelectionShape | null
}

/**
 * A component which is responsible for providing a user interface to edit {@link RichContent}.
 *
 */
export class TextBlockInput extends Component<TextBlockInputProps, State> {
  private textChangeSession: TextChangeSession | null = null
  private textInputRef = React.createRef<TextInput>()
  private blockScopedSelection = Selection.fromShape({ start: 0, end: 0 })
  private nextOverridingSelection: SelectionShape | null = null

  public state: State = {
    overridingSelection: null,
  }

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
  private focus(nextOverrideSelection?: SelectionShape) {
    this.nextOverridingSelection = nextOverrideSelection || null
    this.textInputRef.current && this.textInputRef.current.focus()
  }

  @boundMethod
  private handleOnFocus() {
    const nextOverridingSelection = this.nextOverridingSelection
    if (nextOverridingSelection !== null) {
      this.setState({ overridingSelection: nextOverridingSelection })
      this.blockScopedSelection = Selection.fromShape(nextOverridingSelection)
      this.nextOverridingSelection = null
    }
  }

  public shouldComponentUpdate(nextProps: TextBlockInputProps, nextState: State) {
    return (
      nextProps.overridingScopedSelection !== this.props.overridingScopedSelection ||
      nextProps.textOps !== this.props.textOps ||
      nextProps.isFocused !== this.props.isFocused ||
      nextState.overridingSelection !== this.props.overridingScopedSelection
    )
  }

  public async updateSelection(currentSelection: Selection) {
    this.blockScopedSelection = currentSelection
    return this.props.controller.updateSelectionInBlock(currentSelection)
  }

  private updateOps(documentDeltaUpdate: DocumentDeltaAtomicUpdate) {
    this.blockScopedSelection = documentDeltaUpdate.selectionAfterChange
    return this.props.controller.applyAtomicDeltaUpdateInBlock(documentDeltaUpdate)
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
    if (this.state.overridingSelection !== null) {
      setTimeout(() => this.setState({ overridingSelection: null }))
    }
    const blockScopedSelection = this.props.blockScopedSelection
    if (this.props.isFocused && blockScopedSelection) {
      if (!oldProps.isFocused) {
        this.blockScopedSelection = Selection.fromShape(blockScopedSelection)
        this.focus(blockScopedSelection)
      } else if (
        blockScopedSelection.start !== this.blockScopedSelection.start ||
        blockScopedSelection.end !== this.blockScopedSelection.end
      ) {
        this.blockScopedSelection = Selection.fromShape(blockScopedSelection)
        this.setState({ overridingSelection: blockScopedSelection })
      }
    }
    if (this.props.isFocused && this.props.overridingScopedSelection !== null) {
      this.blockScopedSelection = Selection.fromShape(this.props.overridingScopedSelection)
    }
  }

  public render() {
    const { textStyle, textOps, textTransformSpecs } = this.props
    const overriding = this.props.overridingScopedSelection || this.state.overridingSelection
    return (
      <View style={styles.grow}>
        <TextInput
          selection={overriding ? overriding : undefined}
          style={[styles.grow, styles.textInput, richTextStyles.defaultText, textStyle, genericStyles.zeroSpacing]}
          onKeyPress={this.handleOnKeyPressed}
          onSelectionChange={this.handleOnSelectionChanged}
          onChangeText={this.handleOnTextChanged}
          ref={this.textInputRef}
          onFocus={this.handleOnFocus}
          {...constantTextInputProps}
        >
          <RichText textStyle={textStyle} textTransformSpecs={textTransformSpecs} textOps={textOps} />
        </TextInput>
      </View>
    )
  }
}
