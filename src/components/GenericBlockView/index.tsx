/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { TextBlockView } from './TextBlockView'
import { StyleProp, TextStyle, ViewStyle, View } from 'react-native'
import { ImageBlockView } from './ImageBlockView'
import { TextOp, ImageOp } from '@delta/operations'
import invariant from 'invariant'
import { Transforms } from '@core/Transforms'
import { Images } from '@core/Images'
import { StandardBlockViewProps } from './types'

export interface GenericBlockViewProps extends StandardBlockViewProps {
  textStyle?: StyleProp<TextStyle>
  imageLocatorService: Images.LocationService<any>
  textTransforms: Transforms
  contentWidth: null | number
  blockStyle?: StyleProp<ViewStyle>
}

export class GenericBlockView extends PureComponent<GenericBlockViewProps> {
  public render() {
    const { descriptor, textStyle, imageLocatorService, contentWidth, blockStyle, ...otherProps } = this.props
    let block = null
    const realContentWidth = this.props.contentWidth
    if (descriptor.kind === 'text') {
      block = React.createElement(TextBlockView, {
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
      block = React.createElement(ImageBlockView, imageProps)
    }
    return <View style={blockStyle}>{block}</View>
  }
}
