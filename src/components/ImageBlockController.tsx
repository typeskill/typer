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
}

export class ImageBlockController extends PureComponent<ImageBlockControllerProps> {
  public render() {
    const { Component } = this.props.imageLocatorService
    console.info('ATTRIBUTES', this.props.imageOp.attributes)
    return React.createElement(Component, this.props.imageOp.attributes)
  }
}
