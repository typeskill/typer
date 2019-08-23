import React, { PureComponent } from 'react'
import {
  View,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  TouchableWithoutFeedback,
  TextInputProps,
} from 'react-native'
import { Bridge } from '@core/Bridge'
import { ImageOp } from '@delta/operations'
import { boundMethod } from 'autobind-decorator'
import { StandardBlockControllerProps } from './GenericBlockController'

export interface ImageBlockControllerProps extends StandardBlockControllerProps {
  imageOp: ImageOp
  imageLocatorService: Bridge.ImageLocationService<any>
  contentWidth: number
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
  blurOnSubmit: false,
} as TextInputProps

const TEXT_INPUT_WIDTH = 3

interface State {
  isSelectedForDeletion: boolean
}

export class ImageBlockController extends PureComponent<ImageBlockControllerProps, State> {
  private textRef = React.createRef<TextInput>()
  public state: State = {
    isSelectedForDeletion: false,
  }
  private computeDimensions() {
    const { contentWidth, imageLocatorService, imageOp } = this.props
    return imageLocatorService.computeImageDimensions(imageOp.attributes, contentWidth)
  }

  @boundMethod
  private handleOnSubmit() {
    this.props.moveAfterBlock()
  }

  @boundMethod
  private handleOnKeyPress(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    const key = e.nativeEvent.key
    if (key === 'Backspace') {
      if (this.state.isSelectedForDeletion) {
        this.props.removeCurrentBlock()
      } else {
        this.setState({ isSelectedForDeletion: true })
      }
    } else {
      this.props.insertAfterBlock(key)
    }
  }

  private renderImage(dimensions: Bridge.Dimensions) {
    const { contentWidth: containerWidth } = this.props
    const { Component } = this.props.imageLocatorService
    const props = {
      containerWidth: containerWidth - TEXT_INPUT_WIDTH,
      params: this.props.imageOp.attributes,
      dimensions,
    }
    return <Component {...props} />
  }

  @boundMethod
  private focus() {
    this.textRef.current && this.textRef.current.focus()
  }

  private renderTextInput({ height }: Bridge.Dimensions) {
    return (
      <TextInput
        ref={this.textRef}
        onKeyPress={this.handleOnKeyPress}
        onSubmitEditing={this.handleOnSubmit}
        value="AA"
        style={{
          width: TEXT_INPUT_WIDTH,
          height: height,
          fontSize: height,
          color: 'transparent',
          padding: 0,
          borderWidth: 0,
        }}
        {...constantTextInputProps}
      />
    )
  }

  public componentDidMount() {
    if (this.props.isFocused) {
      this.focus()
    }
  }

  public componentDidUpdate(oldProps: ImageBlockControllerProps) {
    if (!oldProps.isFocused && this.props.isFocused) {
      this.setState({ isSelectedForDeletion: false })
      this.focus()
    }
  }

  public render() {
    const { isSelectedForDeletion } = this.state
    const dynamicStyle = isSelectedForDeletion ? { backgroundColor: 'blue', opacity: 0.5 } : null
    const dimensions = this.computeDimensions()
    return (
      <TouchableWithoutFeedback onPress={this.focus}>
        <View style={[{ flexDirection: 'row' }, dynamicStyle]}>
          {this.renderImage(dimensions)}
          {this.renderTextInput(dimensions)}
        </View>
      </TouchableWithoutFeedback>
    )
  }
}
