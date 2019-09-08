/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { TextBlockInput } from './TextBlockInput'
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native'
import { ImageBlockInput } from './ImageBlockInput'
import { TextOp, ImageOp } from '@delta/operations'
import invariant from 'invariant'
import { Transforms } from '@core/Transforms'
import { Attributes } from '@delta/attributes'
import { SelectionShape } from '@delta/Selection'
import { Images } from '@core/Images'
import { StandardBlockInputProps } from './types'

export interface GenericBlockInputProps extends StandardBlockInputProps {
  textStyle?: StyleProp<TextStyle>
  imageLocatorService: Images.LocationService<any>
  textTransforms: Transforms
  textAttributesAtCursor: Attributes.Map
  contentWidth: null | number
  blockScopedSelection: SelectionShape
  hightlightOnFocus: boolean
  blockStyle?: StyleProp<ViewStyle>
}

export class GenericBlockInput extends PureComponent<GenericBlockInputProps> {
  private getStyles() {
    if (this.props.hightlightOnFocus) {
      return this.props.isFocused ? { borderColor: 'red', borderWidth: 1 } : { borderColor: 'gray', borderWidth: 1 }
    }
    return undefined
  }
  public render() {
    const { descriptor, textStyle, imageLocatorService, contentWidth, blockStyle, ...otherProps } = this.props
    let block = null
    const realContentWidth = this.props.contentWidth
      ? this.props.contentWidth - (this.props.hightlightOnFocus ? 2 : 0)
      : null
    if (descriptor.kind === 'text') {
      block = React.createElement(TextBlockInput, {
        descriptor,
        textStyle,
        textOps: descriptor.opsSlice as TextOp[],
        ...otherProps,
      })
    } else if (descriptor.kind === 'image' && realContentWidth !== null) {
      invariant(descriptor.opsSlice.length === 1, `Image blocks must be grouped alone.`)
      const imageProps = {
        descriptor,
        imageOp: descriptor.opsSlice[0] as ImageOp,
        imageLocatorService,
        contentWidth: realContentWidth,
        ...otherProps,
      }
      block = React.createElement(ImageBlockInput, imageProps)
    }
    return <View style={[this.getStyles(), blockStyle]}>{block}</View>
  }
}
