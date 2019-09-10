/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { TextBlockView, TextBlockViewProps } from './TextBlockView'
import { StyleProp, TextStyle, ViewStyle, View } from 'react-native'
import { ImageBlockView, ImageBlockViewProps } from './ImageBlockView'
import { TextOp, ImageOp } from '@delta/operations'
import invariant from 'invariant'
import { Transforms } from '@core/Transforms'
import { Images } from '@core/Images'
import { StandardBlockViewProps } from './types'

export interface GenericBlockViewProps<ImageSource> extends StandardBlockViewProps {
  textStyle?: StyleProp<TextStyle>
  ImageComponent: Images.Component<ImageSource>
  textTransformSpecs: Transforms.Specs
  contentWidth: null | number
  blockStyle?: StyleProp<ViewStyle>
  maxMediaBlockWidth?: number
  maxMediaBlockHeight?: number
}

export class GenericBlockView<ImageSource> extends PureComponent<GenericBlockViewProps<ImageSource>> {
  public render() {
    const {
      descriptor,
      textStyle,
      contentWidth,
      blockStyle,
      maxMediaBlockHeight,
      maxMediaBlockWidth,
      textTransformSpecs,
      ImageComponent,
    } = this.props
    let block = null
    if (descriptor.kind === 'text') {
      const textBlockProps: TextBlockViewProps = {
        descriptor,
        textStyle,
        textTransformSpecs,
        textOps: descriptor.opsSlice as TextOp[],
      }
      block = <TextBlockView {...textBlockProps} />
    } else if (descriptor.kind === 'image' && contentWidth !== null) {
      invariant(descriptor.opsSlice.length === 1, `Image blocks must be grouped alone.`)
      const imageBlockProps: ImageBlockViewProps<ImageSource> = {
        descriptor,
        ImageComponent,
        maxMediaBlockHeight,
        maxMediaBlockWidth,
        imageOp: descriptor.opsSlice[0] as ImageOp<ImageSource>,
        contentWidth: contentWidth,
      }
      block = <ImageBlockView<ImageSource> {...imageBlockProps} />
    }
    return <View style={blockStyle}>{block}</View>
  }
}
