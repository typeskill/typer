/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { TextBlockInput, TextBlockInputProps } from './TextBlockInput'
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native'
import { ImageBlockInput, ImageBlockInputProps } from './ImageBlockInput'
import { TextOp, ImageOp } from '@delta/operations'
import invariant from 'invariant'
import { Transforms } from '@core/Transforms'
import { Attributes } from '@delta/attributes'
import { SelectionShape } from '@delta/Selection'
import { Images } from '@core/Images'
import { StandardBlockInputProps } from './types'

export interface GenericBlockInputProps<ImageSource> extends StandardBlockInputProps {
  textStyle?: StyleProp<TextStyle>
  imageLocatorService: Images.LocationService<ImageSource>
  textTransforms: Transforms
  textAttributesAtCursor: Attributes.Map
  contentWidth: null | number
  blockScopedSelection: SelectionShape
  hightlightOnFocus: boolean
  blockStyle?: StyleProp<ViewStyle>
  maxMediaBlockWidth?: number
  maxMediaBlockHeight?: number
  underlayColor?: string
}

export class GenericBlockInput<ImageSource> extends PureComponent<GenericBlockInputProps<ImageSource>> {
  private getStyles() {
    if (this.props.hightlightOnFocus) {
      return this.props.isFocused ? { borderColor: 'red', borderWidth: 1 } : { borderColor: 'gray', borderWidth: 1 }
    }
    return undefined
  }
  public render() {
    const {
      descriptor,
      textStyle,
      imageLocatorService,
      contentWidth,
      blockStyle,
      blockScopedSelection,
      controller,
      hightlightOnFocus,
      underlayColor,
      isFocused,
      maxMediaBlockHeight,
      maxMediaBlockWidth,
      overridingScopedSelection,
      textAttributesAtCursor,
      textTransforms,
    } = this.props
    let block = null
    const realContentWidth = contentWidth ? contentWidth - (hightlightOnFocus ? 2 : 0) : null
    if (descriptor.kind === 'text') {
      const textBlockProps: TextBlockInputProps = {
        descriptor,
        textStyle,
        controller,
        isFocused,
        overridingScopedSelection,
        textAttributesAtCursor,
        textTransforms,
        textOps: descriptor.opsSlice as TextOp[],
      }
      block = <TextBlockInput {...textBlockProps} />
    } else if (descriptor.kind === 'image' && realContentWidth !== null) {
      invariant(descriptor.opsSlice.length === 1, `Image blocks must be grouped alone.`)
      const imageBlockProps: ImageBlockInputProps<ImageSource> = {
        descriptor,
        imageLocatorService,
        blockScopedSelection,
        controller,
        isFocused,
        maxMediaBlockHeight,
        maxMediaBlockWidth,
        overridingScopedSelection,
        underlayColor,
        imageOp: descriptor.opsSlice[0] as ImageOp<ImageSource>,
        contentWidth: realContentWidth,
      }
      block = <ImageBlockInput<ImageSource> {...imageBlockProps} />
    }
    return <View style={[this.getStyles(), blockStyle]}>{block}</View>
  }
}
