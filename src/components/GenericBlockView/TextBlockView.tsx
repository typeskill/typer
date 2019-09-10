import React, { PureComponent } from 'react'
import { Transforms } from '@core/Transforms'
import { StyleProp, TextStyle, Text } from 'react-native'
import { TextOp } from '@delta/operations'
import { RichText } from '@components/RichText'
import { StandardBlockViewProps } from './types'

export interface TextBlockViewProps extends StandardBlockViewProps {
  textTransformSpecs: Transforms.Specs
  textStyle?: StyleProp<TextStyle>
  textOps: TextOp[]
}

export class TextBlockView extends PureComponent<TextBlockViewProps> {
  public render() {
    const { textStyle, textOps, textTransformSpecs } = this.props
    return (
      <Text>
        <RichText textStyle={textStyle} textTransformSpecs={textTransformSpecs} textOps={textOps} />
      </Text>
    )
  }
}
