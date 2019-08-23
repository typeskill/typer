/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { PureComponent } from 'react'
import { Bridge } from '@core/Bridge'
import { ImageOp } from '@delta/operations'
import { DocumentContent } from '@model/document'

export interface ImageBlockControllerProps {
  imageOp: ImageOp
  grow: boolean
  imageLocatorService: Bridge.ImageLocationService<any>
  isFocused: boolean
  updateScopedContent: (scopedContent: Partial<DocumentContent>) => Promise<void>
  containerWidth: number
}

export class ImageBlockController extends PureComponent<ImageBlockControllerProps> {
  public render() {
    const { containerWidth } = this.props
    const { Component } = this.props.imageLocatorService
    return React.createElement(Component, { containerWidth, ...this.props.imageOp.attributes })
  }
}
