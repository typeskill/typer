import React, { PureComponent } from 'react'
import {
  View,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TextInputProps,
  ViewStyle,
  StyleSheet,
  TouchableHighlight,
  TextStyle,
  StyleProp,
} from 'react-native'
import { ImageOp } from '@delta/operations'
import { boundMethod } from 'autobind-decorator'
import { SelectionShape } from '@delta/Selection'
import { Images } from '@core/Images'
import { StandardBlockInputProps } from './types'
import { genericStyles } from '@components/styles'

export interface ImageBlockInputProps extends StandardBlockInputProps {
  imageOp: ImageOp
  blockScopedSelection: SelectionShape
  imageLocatorService: Images.LocationService<any>
  contentWidth: number
  underlayColor?: string
}

// eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
const constantTextInputProps: TextInputProps = {
  disableFullscreenUI: true,
  scrollEnabled: false,
  multiline: false,
  returnKeyType: 'next',
  keyboardType: 'default',
  textBreakStrategy: 'highQuality',
  importantForAutofill: 'noExcludeDescendants',
  autoFocus: false,
  blurOnSubmit: false,
} as TextInputProps

const TEXT_INPUT_WIDTH = 4
const DEFAULT_UNDERLAY = 'rgba(30,30,30,0.3)'

const styles = StyleSheet.create({
  imageContainer: { position: 'relative', flexDirection: 'row' },
})

export class ImageBlockInput extends PureComponent<ImageBlockInputProps> {
  private rightInput = React.createRef<TextInput>()
  private leftInput = React.createRef<TextInput>()
  private computeDimensions(contentWidth: number) {
    const { imageLocatorService, imageOp } = this.props
    return imageLocatorService.computeImageDimensions(imageOp.attributes, contentWidth)
  }

  private isSelectedForDeletion(): boolean {
    const { descriptor, blockScopedSelection } = this.props
    return blockScopedSelection.start === 0 && descriptor.numOfSelectableUnits === blockScopedSelection.end
  }

  @boundMethod
  private handleOnSubmit() {
    this.props.controller.moveAfterBlock()
  }

  @boundMethod
  private handleOnSubmitLeft() {
    this.props.controller.insertOrReplaceTextAtSelection('\n')
  }

  @boundMethod
  private handleOnPressLeftHandler() {
    this.props.controller.updateSelectionInBlock({ start: 0, end: 0 })
  }

  @boundMethod
  private handleOnPressRightHandler() {
    this.props.controller.updateSelectionInBlock({ start: 1, end: 1 })
  }

  @boundMethod
  private handleOnPressMiddleHandler() {
    this.props.controller.selectBlock()
  }

  @boundMethod
  private handleOnValueChange(text: string) {
    this.props.controller.insertOrReplaceTextAtSelection(text)
  }

  @boundMethod
  private handleOnKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    const key = e.nativeEvent.key
    if (key === 'Backspace') {
      if (this.isSelectedForDeletion()) {
        this.props.controller.removeCurrentBlock()
      } else if (!this.isLeftSelected()) {
        this.props.controller.selectBlock()
      }
    }
  }

  private renderHandles(fullHandlerWidth: number, containerDimensions: Images.Dimensions) {
    const underlayColor = this.props.underlayColor || DEFAULT_UNDERLAY
    const touchableStyle: ViewStyle = {
      width: fullHandlerWidth,
      height: containerDimensions.height,
      position: 'absolute',
      backgroundColor: 'transparent',
    }
    const leftHandlePosition = {
      left: 0,
      bottom: 0,
      top: 0,
      right: containerDimensions.width - fullHandlerWidth,
    }
    const rightHandlePosition = {
      bottom: 0,
      top: 0,
      right: 0,
      left: containerDimensions.width - fullHandlerWidth,
    }
    return (
      <React.Fragment>
        <TouchableHighlight
          underlayColor={underlayColor}
          style={[touchableStyle, leftHandlePosition]}
          onPress={this.handleOnPressLeftHandler}
        >
          <View />
        </TouchableHighlight>
        <TouchableHighlight
          underlayColor={underlayColor}
          style={[touchableStyle, rightHandlePosition]}
          onPress={this.handleOnPressRightHandler}
        >
          <View />
        </TouchableHighlight>
      </React.Fragment>
    )
  }

  private renderImageFrame(
    spareWidthOnSides: number,
    imageDimensions: Images.Dimensions,
    containerDimensions: Images.Dimensions,
  ) {
    const selectStyle = this.isSelectedForDeletion() ? { backgroundColor: 'blue', opacity: 0.5 } : null
    const { Component } = this.props.imageLocatorService
    const imageComponentProps = {
      containerWidth: this.props.contentWidth,
      params: this.props.imageOp.attributes,
      dimensions: imageDimensions,
    }
    const imageFrameStyle: ViewStyle = {
      ...imageDimensions,
      position: 'relative',
    }
    const leftInputStyle: ViewStyle = {
      position: 'absolute',
      left: 0,
      top: 0,
      right: imageDimensions.width,
      bottom: 0,
      height: imageDimensions.height,
      width: TEXT_INPUT_WIDTH,
    }
    const rightInputStyle: ViewStyle = {
      position: 'absolute',
      left: imageDimensions.width - TEXT_INPUT_WIDTH,
      top: 0,
      right: 0,
      bottom: 0,
      height: imageDimensions.height,
      width: TEXT_INPUT_WIDTH,
    }
    const imageHandleStyle: StyleProp<ViewStyle> = [selectStyle, imageDimensions]
    const imageWrapperStyle: ViewStyle = {
      position: 'absolute',
      left: spareWidthOnSides,
      right: spareWidthOnSides,
      bottom: 0,
      top: 0,
      ...imageDimensions,
    }
    return (
      <View style={imageFrameStyle}>
        <View style={imageWrapperStyle}>
          <TouchableHighlight onPress={this.handleOnPressMiddleHandler} style={imageHandleStyle}>
            <Component {...imageComponentProps} />
          </TouchableHighlight>
        </View>
        <View style={leftInputStyle}>{this.renderTextInput(containerDimensions, this.leftInput)}</View>
        <View style={rightInputStyle}>{this.renderTextInput(containerDimensions, this.rightInput)}</View>
      </View>
    )
  }

  private renderImage(
    imageDimensions: Images.Dimensions,
    containerDimensions: Images.Dimensions,
    spareWidthOnSides: number,
    handlerWidth: number,
  ) {
    const fullHandlerWidth = handlerWidth + spareWidthOnSides
    return (
      <View style={[styles.imageContainer, containerDimensions]}>
        {this.renderImageFrame(spareWidthOnSides, imageDimensions, containerDimensions)}
        {this.renderHandles(fullHandlerWidth, containerDimensions)}
      </View>
    )
  }

  private isLeftSelected() {
    const selection = this.props.blockScopedSelection
    return selection.start === selection.end && selection.start === 0
  }

  private focusRight() {
    this.rightInput.current && this.rightInput.current.focus()
  }

  private focusLeft() {
    this.leftInput.current && this.leftInput.current.focus()
  }

  @boundMethod
  private focus() {
    if (this.isLeftSelected()) {
      this.focusLeft()
    } else {
      this.focusRight()
    }
  }

  private renderTextInput({ height }: Images.Dimensions, ref: React.RefObject<TextInput>) {
    const dynamicStyle: TextStyle = {
      width: TEXT_INPUT_WIDTH,
      height: height,
      fontSize: height,
      color: 'transparent',
      padding: 0,
      borderWidth: 0,
      textAlign: 'center',
      backgroundColor: 'rgba(215,215,215,0.1)',
    }
    return (
      <TextInput
        ref={ref}
        onKeyPress={this.handleOnKeyPress}
        onChangeText={this.handleOnValueChange}
        onSubmitEditing={this.handleOnSubmit}
        style={[dynamicStyle, genericStyles.zeroSpacing]}
        {...constantTextInputProps}
      />
    )
  }

  public componentDidMount() {
    if (this.props.isFocused) {
      this.focus()
    }
  }

  public componentDidUpdate(oldProps: ImageBlockInputProps) {
    if (
      (this.props.isFocused && !oldProps.isFocused) ||
      ((oldProps.blockScopedSelection.start !== this.props.blockScopedSelection.start ||
        oldProps.blockScopedSelection.end !== this.props.blockScopedSelection.end) &&
        this.props.isFocused)
    ) {
      setTimeout(this.focus, 0)
    }
  }

  public render() {
    const imageDimensions = this.computeDimensions(this.props.contentWidth)
    const containerDimensions = {
      width: this.props.contentWidth,
      height: imageDimensions.height,
    }
    const spareWidthOnSides = Math.max(
      (containerDimensions.width - imageDimensions.width - 2 * TEXT_INPUT_WIDTH) / 2,
      0,
    )
    const handlerWidth = Math.min(containerDimensions.width / 3, 60)
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {this.renderImage(imageDimensions, containerDimensions, spareWidthOnSides, handlerWidth)}
      </View>
    )
  }
}
