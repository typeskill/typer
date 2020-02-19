import React, { ReactNode, Component, ComponentClass } from 'react'
import { TextStyle, Text, StyleProp, StyleSheet } from 'react-native'
import { GenericOp, isTextOp, TextOp } from '@delta/operations'
import { Transforms } from '@core/Transforms'
import invariant from 'invariant'
import { boundMethod } from 'autobind-decorator'
import { LineWalker } from '@delta/LineWalker'
import { Attributes } from '@delta/attributes'
import PropTypes from 'prop-types'
import { OpsPropType, TextTransformSpecsType } from './types'

/**
 * A set of definitions related to the {@link (RichText:type)} component.
 *
 * @public
 */
declare namespace RichText {
  /**
   * Properties for the {@link (RichText:type)} component.
   */
  export interface Props {
    /**
     * The content to display.
     */
    textOps: TextOp[]
    /**
     * An object describing how to convert attributes to style properties.
     */
    textTransformSpecs: Transforms.Specs
    /**
     * Default text style.
     *
     * @remarks
     *
     * Text style can be overriden depending on attributes applying to an {@link GenericOp | operation}.
     * The mapped styled are dictated by the `textTransformsReg` property.
     */
    textStyle?: StyleProp<TextStyle>
  }
}

function getLineStyle(lineType: Attributes.LineType): StyleProp<TextStyle> {
  // Padding is supported from direct Text descendents of
  // TextInput as of RN60
  // TODO test
  switch (lineType) {
    case 'normal':
      return null
    case 'quoted':
      return { borderLeftWidth: 3, borderLeftColor: 'black' }
  }
}

export const richTextStyles = StyleSheet.create({
  defaultText: {
    fontSize: 18,
  },
  grow: {
    flexGrow: 1,
  },
})

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _RichText extends Component<RichText.Props> {
  private transforms: Transforms
  public static propTypes: Record<keyof RichText.Props, unknown> = {
    textOps: OpsPropType.isRequired,
    textStyle: PropTypes.any,
    textTransformSpecs: TextTransformSpecsType.isRequired,
  }

  public constructor(props: RichText.Props) {
    super(props)
    this.renderOperation = this.renderOperation.bind(this)
    this.transforms = new Transforms(props.textTransformSpecs)
  }

  @boundMethod
  private renderOperation(op: GenericOp, lineIndex: number, elemIndex: number) {
    invariant(isTextOp(op), 'Only textual documentDelta are supported')
    const key = `text-${lineIndex}-${elemIndex}`
    const styles = this.transforms.getStylesFromOp(op as TextOp)
    return (
      <Text style={styles} key={key}>
        {op.insert}
      </Text>
    )
  }

  private renderLines() {
    const { textOps, textStyle } = this.props
    const children: ReactNode[][] = []
    new LineWalker(textOps).eachLine(({ lineType, delta: lineDelta, index }) => {
      const textStyles = [textStyle, getLineStyle(lineType)]
      const lineChildren = lineDelta.ops.map((l, elIndex) => this.renderOperation(l, index, elIndex))
      children.push([
        <Text style={textStyles} key={`line-${index}`}>
          {lineChildren}
        </Text>,
      ])
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

  /**
   * @internal
   */
  public shouldComponentUpdate() {
    return true
  }

  /**
   * @internal
   */
  public componentDidUpdate(oldProps: RichText.Props) {
    invariant(
      oldProps.textTransformSpecs === this.props.textTransformSpecs,
      'transforms prop cannot be changed after instantiation',
    )
  }

  /**
   * @internal
   */
  public render() {
    return this.renderLines()
  }
}

/**
 * A component to display rich content.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting members which should be out of API surface.
 */
type RichText = ComponentClass<RichText.Props>
const RichText = _RichText as RichText

export { RichText }
