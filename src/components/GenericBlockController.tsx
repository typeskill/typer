/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { TextBlockController } from './TextBlockController'
import { StyleProp, TextStyle, View } from 'react-native'
import { ImageBlockController } from './ImageBlockController'
import { BlockDescriptor } from '@model/blocks'
import { TextOp, ImageOp } from '@delta/operations'
import invariant from 'invariant'
import { Transforms } from '@core/Transforms'
import { Attributes } from '@delta/attributes'
import { DocumentController } from './DocumentController'
import { SelectionShape } from '@delta/Selection'
import { Image } from '@core/Image'

export interface StandardBlockControllerProps {
  descriptor: BlockDescriptor
  controller: DocumentController
  isFocused: boolean
  overridingScopedSelection: SelectionShape | null
}

export interface GenericBlockControllerProps extends StandardBlockControllerProps {
  textStyle?: StyleProp<TextStyle>
  imageLocatorService: Image.LocationService<any>
  textTransforms: Transforms
  textAttributesAtCursor: Attributes.Map
  contentWidth: null | number
  blockScopedSelection: SelectionShape
  hightlightOnFocus: boolean
}

export class GenericBlockController extends PureComponent<GenericBlockControllerProps> {
  private getStyles() {
    if (this.props.hightlightOnFocus) {
      return this.props.isFocused ? { borderColor: 'red', borderWidth: 1 } : { borderColor: 'gray', borderWidth: 1 }
    }
    return undefined
  }
  public render() {
    const { descriptor, textStyle, imageLocatorService, contentWidth, ...otherProps } = this.props
    let block = null
    const realContentWidth = this.props.contentWidth
      ? this.props.contentWidth - (this.props.hightlightOnFocus ? 2 : 0)
      : null
    if (descriptor.kind === 'text') {
      block = React.createElement(TextBlockController, {
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
      block = React.createElement(ImageBlockController, imageProps)
    }
    return <View style={this.getStyles()}>{block}</View>
  }
}
