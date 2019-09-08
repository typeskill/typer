import { PureComponent } from 'react'
import { DocumentPropType } from './types'
import PropTypes from 'prop-types'
import { Document } from '@model/document'
import { StyleSheet, StyleProp, ViewStyle, TextStyle, ViewPropTypes, LayoutChangeEvent } from 'react-native'
import invariant from 'invariant'
import { BlockAssembler } from '@model/BlockAssembler'
import { Bridge } from '@core/Bridge'
import { Gen } from '@core/Gen'

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
   * Style applied to the content container.
   *
   * @remarks This prop MUST NOT contain padding or margin rules. Such spacing rules will be zero-ed.
   * Apply padding to the {@link DocumentRendererProps.style | `style`} prop instead.
   */
  contentContainerStyle?: StyleProp<ViewStyle>
}

const contentRendererStyles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  /**
   * As of React Native 0.60, merging padding algorithm doesn't
   * allow more specific spacing attributes to override more
   * generic ones. As such, we must override all.
   */
  overridingContentStyles: {
    margin: 0,
    marginBottom: 0,
    marginEnd: 0,
    marginHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
    marginStart: 0,
    marginTop: 0,
    marginVertical: 0,
    padding: 0,
    paddingBottom: 0,
    paddingEnd: 0,
    paddingHorizontal: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingStart: 0,
    paddingTop: 0,
    paddingVertical: 0,
  },
  root: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
    padding: 10,
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

  protected handleOnContainerLayout = (layoutEvent: LayoutChangeEvent) => {
    this.setState({
      containerWidth: layoutEvent.nativeEvent.layout.width,
    })
  }

  protected getScrollStyles(): StyleProp<ViewStyle> {
    return [contentRendererStyles.scroll, this.props.style]
  }

  protected getRootStyles(): StyleProp<ViewStyle> {
    return contentRendererStyles.root
  }

  protected getContainerStyles(): StyleProp<ViewStyle> {
    return [
      contentRendererStyles.contentContainer,
      this.props.contentContainerStyle,
      contentRendererStyles.overridingContentStyles,
    ]
  }

  public componentDidUpdate(oldProps: P) {
    invariant(oldProps.bridge === this.props.bridge, 'bridge prop cannot be changed after instantiation')
  }
}
