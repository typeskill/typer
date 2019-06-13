import React, { ReactNode, Component } from 'react'
import { TextStyle, Text, StyleProp, StyleSheet } from 'react-native'
import { GenericOp, isTextOp, TextOp } from '@delta/operations'
import { TextTransformsRegistry } from '@core/TextTransformsRegistry'
import invariant from 'invariant'
import { boundMethod } from 'autobind-decorator'
import { TextLineType } from '@delta/lines'
import { LineWalker } from '@delta/LineWalker'

export interface RichTextProps<T extends string> {
  ops: GenericOp[]
  textTransformsReg: TextTransformsRegistry<T>
  textStyle?: StyleProp<TextStyle>
}

function getLineStyle(lineType: TextLineType): StyleProp<TextStyle> {
  // Padding is supported from direct Text descendents of
  // TextInput as of RN60
  // TODO test
  switch (lineType) {
  case 'normal': return null
  case 'ol': return { paddingLeft: 20 }
  case 'quoted': return { borderLeftWidth: 3, borderLeftColor: 'black' }
  case 'ul': return { paddingLeft: 20 }
  }
}

export const richTextStyles = StyleSheet.create({
  defaultText: {
    fontSize: 18
  },
  grow: {
    flexGrow: 1
  }
})

export class RichText<T extends string> extends Component<RichTextProps<T>> {
  private textTransformsReg: TextTransformsRegistry<any>

  constructor(props: RichTextProps<T>) {
    super(props)
    this.renderOperation = this.renderOperation.bind(this)
    this.textTransformsReg = props.textTransformsReg
    invariant(props.textTransformsReg instanceof TextTransformsRegistry, 'textTransformsReg prop is mandatory')
  }

  @boundMethod
  private renderOperation(op: GenericOp, lineIndex: number, elemIndex: number) {
    invariant(isTextOp(op), 'Only textual documentDelta are supported')
    const key = `text-${lineIndex}-${elemIndex}`
    const styles = this.textTransformsReg.getStylesFromOp(op as TextOp<T>)
    return (
      <Text style={styles} key={key}>
        {op.insert}
      </Text>
    )
  }

  private renderLines() {
    const { ops } = this.props
    const children: ReactNode[][] = []
    new LineWalker(ops).eachLine(({ lineType, delta: lineDelta, index }) => {
      children.push([(
        <Text style={getLineStyle(lineType)} key={`line-${index}`}>
          {lineDelta.ops.map((l, elIndex) => this.renderOperation(l, index, elIndex))}
        </Text>
      )])
    })
    if (children.length) {
      let index = 0
      return children.reduce((prev: ReactNode[], curr: ReactNode[]) => {
        if (prev) {
          // tslint:disable-next-line:no-increment-decrement
          return [...prev, <Text key={`text-lr-${index++}`}>{'\n'}</Text>, ...curr]
        }
        return curr
      })
    }
    return []
  }

  shouldComponentUpdate() { return true }

  componentWillReceiveProps(nextProps: RichTextProps<T>) {
    invariant(nextProps.textTransformsReg === this.props.textTransformsReg, 'textTransformsReg prop cannot be changed after instantiation')
  }

  render() {
    return this.renderLines()
  }
}
