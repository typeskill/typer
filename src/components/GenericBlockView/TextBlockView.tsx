import React, { PureComponent } from 'react'
import { Transforms } from '@core/Transforms'
import { StyleProp, TextStyle } from 'react-native'
import { TextOp } from '@delta/operations'
import { StandardBlockViewProps } from '.'
import { RichText } from '@components/RichText'

export interface TextBlockViewProps extends StandardBlockViewProps {
  textTransforms: Transforms
  textStyle?: StyleProp<TextStyle>
  textOps: TextOp[]
}

export class TextBlockView extends PureComponent<TextBlockViewProps> {
  public render() {
    const { textStyle, textOps, textTransforms } = this.props
    return <RichText textStyle={textStyle} transforms={textTransforms} textOps={textOps} />
  }
}
