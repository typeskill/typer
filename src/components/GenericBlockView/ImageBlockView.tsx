import React, { PureComponent } from 'react'
import { View } from 'react-native'
import { Images } from '@core/Images'
import { ImageOp } from '@delta/operations'
import { StandardBlockViewProps } from '.'

export interface ImageBlockViewProps extends StandardBlockViewProps {
  imageLocatorService: Images.LocationService<any>
  imageOp: ImageOp
  contentWidth: number
}

export class ImageBlockView extends PureComponent<ImageBlockViewProps> {
  public render() {
    const { imageLocatorService, imageOp, contentWidth } = this.props
    const Component = imageLocatorService.Component
    const imageDimensions = imageLocatorService.computeImageDimensions(imageOp.attributes, contentWidth)
    const imageComponentProps = {
      containerWidth: contentWidth,
      params: this.props.imageOp.attributes,
      dimensions: imageDimensions,
    }
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Component {...imageComponentProps} />
      </View>
    )
  }
}
