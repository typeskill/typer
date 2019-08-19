/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { Bridge } from '@core/Bridge'
import { ImageOp } from '@delta/operations'

export interface ImageBlockControllerProps {
  imageOp: ImageOp
  grow: boolean
  imageLocatorService: Bridge.ImageLocationService<any>
}

export class ImageBlockController extends PureComponent<ImageBlockControllerProps> {
  public render() {
    const { Component } = this.props.imageLocatorService
    return React.createElement(Component, this.props.imageOp.attributes)
  }
}
