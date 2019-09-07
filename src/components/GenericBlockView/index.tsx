/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { TextBlockView } from './TextBlockView'
import { StyleProp, TextStyle } from 'react-native'
import { ImageBlockView } from './ImageBlockView'
import { BlockDescriptor } from '@model/blocks'
import { TextOp, ImageOp } from '@delta/operations'
import invariant from 'invariant'
import { Transforms } from '@core/Transforms'
import { Images } from '@core/Images'

export interface StandardBlockViewProps {
  descriptor: BlockDescriptor
}

export interface GenericBlockInputProps extends StandardBlockViewProps {
  textStyle?: StyleProp<TextStyle>
  imageLocatorService: Images.LocationService<any>
  textTransforms: Transforms
  contentWidth: null | number
}

export class GenericBlockView extends PureComponent<GenericBlockInputProps> {
  public render() {
    const { descriptor, textStyle, imageLocatorService, contentWidth, ...otherProps } = this.props
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
    return block
  }
}
