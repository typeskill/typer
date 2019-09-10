import React, { PureComponent } from 'react'
import { View, StyleSheet } from 'react-native'
import { Images, computeImageFrame } from '@core/Images'
import { ImageOp } from '@delta/operations'
import { StandardBlockViewProps } from './types'

export interface ImageBlockViewProps<Source> extends StandardBlockViewProps {
  ImageComponent: Images.Component<Source>
  imageOp: ImageOp<Source>
  contentWidth: number
  maxMediaBlockWidth?: number
  maxMediaBlockHeight?: number
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
})

export class ImageBlockView<Source> extends PureComponent<ImageBlockViewProps<Source>> {
  private computeDimensions() {
    const { imageOp, maxMediaBlockHeight, maxMediaBlockWidth, contentWidth } = this.props
    return computeImageFrame(imageOp.insert, contentWidth, maxMediaBlockHeight, maxMediaBlockWidth)
  }

  public render() {
    const { ImageComponent, imageOp } = this.props
    const imageComponentProps: Images.ComponentProps<Source> = {
      description: imageOp.insert,
      printDimensions: this.computeDimensions(),
    }
    return (
      <View style={styles.wrapper}>
        <ImageComponent {...imageComponentProps} />
      </View>
    )
  }
}
