import { PureComponent } from 'react'
import { DocumentPropType } from './types'
import PropTypes from 'prop-types'
import { Document } from '@model/document'
import { StyleSheet, StyleProp, ViewStyle, TextStyle, ViewPropTypes, LayoutChangeEvent } from 'react-native'
import invariant from 'invariant'
import { BlockAssembler } from '@model/BlockAssembler'
import { Bridge } from '@core/Bridge'
import { Gen } from '@core/Gen'
import { genericStyles } from './styles'
import { Block } from '@model/Block'

export interface DocumentRendererState {
  containerWidth: number | null
}

/**
 * A generic interface for components displaying {@link Document | document}.
 *
 * @public
 */
export interface DocumentRendererProps<D> {
  /**
   * The {@link (Bridge:class)} instance.
   *
   * @remarks This property MUST NOT be changed after instantiation.
   */
  bridge: Bridge<D>
  /**
   * The {@link Document | document} to display.
   */
  document: Document
  /**
   * Component styles.
   */
  style?: StyleProp<ViewStyle>
  /**
   * Default text style.
   */
  textStyle?: StyleProp<TextStyle>
  /**
   * The spacing unit.
   *
   * @remarks It is used:
   *
   * - between two adjacent blocks;
   * - to add padding between the container and the rendered document.
   */
  spacing?: number
  /**
   * Style applied to the content container.
   *
   * @remarks This prop MUST NOT contain padding or margin rules. Such spacing rules will be zero-ed.
   * Apply padding to the {@link DocumentRendererProps.style | `style`} prop instead.
   */
  contentContainerStyle?: StyleProp<ViewStyle>
}

const DEFAULT_SPACING = 15

const contentRendererStyles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  root: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
  },
})

/**
 * @internal
 */
export abstract class DocumentRenderer<
  D,
  P extends DocumentRendererProps<D>,
  S extends DocumentRendererState = DocumentRendererState
> extends PureComponent<P, S> {
  public static propTypes: Record<keyof DocumentRendererProps<any>, any> = {
    bridge: PropTypes.instanceOf(Bridge).isRequired,
    style: ViewPropTypes.style,
    contentContainerStyle: ViewPropTypes.style,
    textStyle: PropTypes.any,
    document: DocumentPropType.isRequired,
    spacing: PropTypes.number,
  }

  protected genService: Gen.Service
  protected assembler: BlockAssembler

  public constructor(props: P) {
    super(props)
    const { bridge } = props
    invariant(bridge != null, 'bridge prop is required')
    invariant(bridge instanceof Bridge, 'bridge prop must be an instance of Bridge class')
    this.assembler = new BlockAssembler(props.document)
    this.genService = props.bridge.getGenService()
  }

  private getSpacing() {
    return this.props.spacing || DEFAULT_SPACING
  }

  protected handleOnContainerLayout = (layoutEvent: LayoutChangeEvent) => {
    this.setState({
      containerWidth: layoutEvent.nativeEvent.layout.width,
    })
  }

  protected getScrollStyles(): StyleProp<ViewStyle> {
    return [contentRendererStyles.scroll, this.props.style]
  }

  protected getRootStyles(): StyleProp<ViewStyle> {
    return [contentRendererStyles.root, { padding: this.getSpacing() }]
  }

  protected getContainerStyles(): StyleProp<ViewStyle> {
    return [contentRendererStyles.contentContainer, this.props.contentContainerStyle, genericStyles.zeroSpacing]
  }

  protected getBlockStyle(block: Block) {
    if (block.isLast()) {
      return undefined
    }
    return {
      marginBottom: this.getSpacing(),
    }
  }

  public componentDidUpdate(oldProps: P) {
    invariant(oldProps.bridge === this.props.bridge, 'bridge prop cannot be changed after instantiation')
  }
}
