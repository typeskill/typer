/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { ImageBlock } from '@model/ImageBlock'
import { Bridge } from '@core/Bridge'

export interface ImageBlockControllerProps {
  block: ImageBlock<any>
  grow: boolean
  imageLocatorService: Bridge.ImageLocationService<any, any>
}

export class ImageBlockController extends PureComponent<ImageBlockControllerProps> {
  public render() {
    const { config, Component } = this.props.imageLocatorService
    return React.createElement(Component, { config, description: this.props.block.getImageDescription() })
  }
}
