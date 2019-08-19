/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { Block } from '@model/Block'
import { TextBlockController } from './TextBlockController'
import { TextBlock } from '@model/TextBlock'
import { StyleProp, TextStyle } from 'react-native'
import { Bridge } from '@core/Bridge'
import { ImageBlockController } from './ImageBlockController'
import { ImageBlock } from '@model/ImageBlock'

export interface GenericBlockControllerProps {
  block: Block
  textStyle?: StyleProp<TextStyle>
  grow: boolean
  imageLocatorService: Bridge.ImageLocationService<any, any>
}

export class GenericBlockController extends PureComponent<GenericBlockControllerProps> {
  public render() {
    const { block, textStyle, imageLocatorService, ...otherProps } = this.props
    if (block instanceof TextBlock) {
      return React.createElement(TextBlockController, { block, textStyle, ...otherProps })
    }
    if (block instanceof ImageBlock) {
      return React.createElement(ImageBlockController, {
        block,
        imageLocatorService,
        ...otherProps,
      })
    }
    return null
  }
}
