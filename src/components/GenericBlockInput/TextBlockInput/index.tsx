import React, { memo, useRef, useCallback, forwardRef, useImperativeHandle, useEffect, PropsWithChildren } from 'react'
import {
  View,
  TextInput,
  NativeSyntheticEvent,
  StyleSheet,
  TextInputProps,
  TextInputKeyPressEventData,
  StyleProp,
  TextStyle,
  Platform,
} from 'react-native'
import { RichText, richTextStyles } from '@components/RichText'
import { SelectionShape } from '@delta/Selection'
import { TextOp } from '@delta/operations'
import { Attributes } from '@delta/attributes'
import { Transforms } from '@core/Transforms'
import { TextChangeSession } from './TextChangeSession'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'
import { StandardBlockInputProps, FocusableInput } from '../types'
import { genericStyles } from '@components/styles'
import {
  TextChangeSessionOwner,
  androidTextChangeSessionBehavior,
  iosTextChangeSessionBehavior,
} from './TextChangeSessionBehavior'
import partial from 'ramda/es/partial'

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
  disableSelectionOverrides: boolean
}

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

function selectionShapesAreEqual(s1: SelectionShape | null, s2: SelectionShape | null): boolean {
  return !!s1 && !!s2 && s1.start === s2.start && s1.end === s2.end
}

function propsAreEqual(
  previousProps: Readonly<PropsWithChildren<TextBlockInputProps>>,
  nextProps: Readonly<PropsWithChildren<TextBlockInputProps>>,
) {
  return (
    nextProps.overridingScopedSelection === previousProps.overridingScopedSelection &&
    nextProps.textOps === previousProps.textOps &&
    nextProps.isFocused === previousProps.isFocused &&
    selectionShapesAreEqual(previousProps.blockScopedSelection, nextProps.blockScopedSelection)
  )
}

const sessionBehavior = Platform.select({
  ios: iosTextChangeSessionBehavior,
  default: androidTextChangeSessionBehavior,
})

function _TextBlockInput(
  {
    textStyle,
    textOps,
    textTransformSpecs,
    overridingScopedSelection,
    disableSelectionOverrides,
    blockScopedSelection,
    controller,
    isFocused,
    textAttributesAtCursor,
  }: TextBlockInputProps,
  ref: any,
) {
  const inputRef = useRef<TextInput>()
  const timeoutRef = useRef<any | null>()
  const textInputSelectionRef = useRef<SelectionShape | null>(blockScopedSelection)
  const nextOverrideSelectionRef = useRef<SelectionShape | null>(null)
  const cachedChangeSessionRef = useRef<TextChangeSession | null>(null)
  const hasFocusRef = useRef<boolean>(false)
  const setTimeoutLocal = useCallback((callback: Function, duration: number) => {
    timeoutRef.current = setTimeout(callback, duration)
  }, [])
  const clearTimeoutLocal = useCallback(() => {
    clearTimeout(timeoutRef.current)
  }, [])
  const getOps = useCallback(() => textOps, [textOps])
  const getAttributesAtCursor = useCallback(() => textAttributesAtCursor, [textAttributesAtCursor])
  const getBlockScopedSelection = useCallback(() => textInputSelectionRef.current, [])
  const getTextChangeSession = useCallback(() => cachedChangeSessionRef.current, [])
  const setTextChangeSession = useCallback(function setTextChangeSession(session: TextChangeSession | null) {
    cachedChangeSessionRef.current = session
  }, [])
  const setCachedSelection = useCallback(function setCachedSelection(selection: SelectionShape) {
    textInputSelectionRef.current = selection
  }, [])
  const focus = useCallback(function focus(nextOverrideSelection?: SelectionShape | null) {
    inputRef.current && inputRef.current.focus()
    if (nextOverrideSelection) {
      nextOverrideSelectionRef.current = nextOverrideSelection
    }
  }, [])
  const handleOnKeyPressed = useCallback(
    function handleOnKeyPressed(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
      const key = e.nativeEvent.key
      const cachedSelection = textInputSelectionRef.current
      if (key === 'Backspace' && cachedSelection && cachedSelection.start === 0 && cachedSelection.end === 0) {
        controller.removeOneBeforeBlock()
      }
    },
    [controller],
  )
  useImperativeHandle(ref, () => ({
    focus,
  }))
  // Clear timeout on unmount
  useEffect(() => {
    return clearTimeoutLocal
  }, [clearTimeoutLocal])
  // On focus
  useEffect(() => {
    if (isFocused && !hasFocusRef.current) {
      focus()
    } else if (!isFocused) {
      hasFocusRef.current = false
    }
  }, [isFocused, blockScopedSelection, focus])
  const handleOnFocus = useCallback(function handleOnFocus() {
    hasFocusRef.current = true
  }, [])
  const updateOps = useCallback(
    function updateOps(documentDeltaUpdate: DocumentDeltaAtomicUpdate) {
      setCachedSelection(documentDeltaUpdate.selectionAfterChange.toShape())
      return controller.applyAtomicDeltaUpdateInBlock(documentDeltaUpdate)
    },
    [controller, setCachedSelection],
  )
  const updateSelection = useCallback(
    function updateSelection(currentSelection: SelectionShape) {
      setCachedSelection(currentSelection)
      controller.updateSelectionInBlock(currentSelection)
    },
    [controller, setCachedSelection],
  )
  const sessionChangeOwner: TextChangeSessionOwner = {
    getBlockScopedSelection,
    getTextChangeSession,
    getAttributesAtCursor,
    getOps,
    setTextChangeSession,
    updateOps,
    updateSelection,
    setTimeout: setTimeoutLocal,
    clearTimeout: clearTimeoutLocal,
  }
  const forcedSelection = !disableSelectionOverrides && overridingScopedSelection
  const handleOnChangeText = useCallback(partial(sessionBehavior.handleOnTextChanged, [sessionChangeOwner]), [
    sessionChangeOwner,
  ])
  const handleOnSelectionChange = useCallback(partial(sessionBehavior.handleOnSelectionChanged, [sessionChangeOwner]), [
    sessionChangeOwner,
  ])
  useEffect(
    function setNativeSelection() {
      forcedSelection &&
        inputRef.current &&
        inputRef.current.setNativeProps({
          selection: forcedSelection,
        })
    },
    [forcedSelection],
  )
  return (
    <View style={styles.grow}>
      <TextInput
        style={[styles.grow, styles.textInput, richTextStyles.defaultText, textStyle, genericStyles.zeroSpacing]}
        onKeyPress={handleOnKeyPressed}
        onSelectionChange={handleOnSelectionChange}
        onChangeText={handleOnChangeText}
        ref={inputRef as any}
        onFocus={handleOnFocus}
        {...constantTextInputProps}
      >
        <RichText textStyle={textStyle} textTransformSpecs={textTransformSpecs} textOps={textOps} />
      </TextInput>
    </View>
  )
}

/**
 * A component which is responsible for providing a user interface to edit {@link RichContent}.
 */
export const TextBlockInput = memo(forwardRef<FocusableInput, TextBlockInputProps>(_TextBlockInput), propsAreEqual)

TextBlockInput.displayName = 'TextBlockInput'
