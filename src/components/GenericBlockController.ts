/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { TextBlockController } from './TextBlockController'
import { StyleProp, TextStyle } from 'react-native'
import { Bridge } from '@core/Bridge'
import { ImageBlockController } from './ImageBlockController'
import { BlockDescriptor } from '@model/blocks'
import { TextOp, ImageOp } from '@delta/operations'
import invariant from 'invariant'
import { DocumentContent } from '@model/document'
import { Transforms } from '@core/Transforms'
import { Attributes } from '@delta/attributes'

export interface GenericBlockControllerProps {
  descriptor: BlockDescriptor
  textStyle?: StyleProp<TextStyle>
  grow: boolean
  imageLocatorService: Bridge.ImageLocationService<any>
  updateScopedContent: (scopedContent: Partial<DocumentContent>) => Promise<void>
  isFocused: boolean
  textTransforms: Transforms
  textAttributesAtCursor: Attributes.Map
}

export class GenericBlockController extends PureComponent<GenericBlockControllerProps> {
  public render() {
    const { descriptor, textStyle, imageLocatorService, ...otherProps } = this.props
    if (descriptor.kind === 'text') {
      return React.createElement(TextBlockController, {
        textOps: descriptor.opsSlice as TextOp[],
        textStyle,
        ...otherProps,
      })
    }
    if (descriptor.kind === 'image') {
      invariant(descriptor.opsSlice.length === 1, `Image blocks must be grouped alone.`)
      return React.createElement(ImageBlockController, {
        imageOp: descriptor.opsSlice[0] as ImageOp,
        imageLocatorService,
        ...otherProps,
      })
    }
    return null
  }
}
