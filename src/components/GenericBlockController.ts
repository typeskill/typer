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

export interface StandardBlockControllerProps {
  descriptor: BlockDescriptor
  isFirst: boolean
  isLast: boolean
  updateScopedContent: (scopedContent: Partial<DocumentContent>) => Promise<void>
  removeCurrentBlock: () => void
  insertAfterBlock: (text: string) => void
  moveAfterBlock: () => void
  moveBeforeBlock: () => void
  isFocused: boolean
}

export interface GenericBlockControllerProps extends StandardBlockControllerProps {
  textStyle?: StyleProp<TextStyle>
  imageLocatorService: Bridge.ImageLocationService<any>
  textTransforms: Transforms
  textAttributesAtCursor: Attributes.Map
  contentWidth: null | number
}

export class GenericBlockController extends PureComponent<GenericBlockControllerProps> {
  public render() {
    const { descriptor, textStyle, imageLocatorService, contentWidth, ...otherProps } = this.props
    if (descriptor.kind === 'text') {
      return React.createElement(TextBlockController, {
        descriptor,
        textStyle,
        textOps: descriptor.opsSlice as TextOp[],
        ...otherProps,
      })
    }
    if (descriptor.kind === 'image' && contentWidth !== null) {
      invariant(descriptor.opsSlice.length === 1, `Image blocks must be grouped alone.`)
      const imageProps = {
        descriptor,
        imageOp: descriptor.opsSlice[0] as ImageOp,
        imageLocatorService,
        contentWidth,
        ...otherProps,
      }
      return React.createElement(ImageBlockController, imageProps)
    }
    return null
  }
}
