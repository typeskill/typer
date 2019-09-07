import { PureComponent } from 'react'
import { Bridge, Gen } from 'index'
import { DocumentContentPropType } from './types'
import PropTypes from 'prop-types'
import { DocumentContent } from '@model/documents'
import { StyleSheet, StyleProp, ViewStyle, TextStyle, ViewPropTypes, LayoutChangeEvent } from 'react-native'
import invariant from 'invariant'
import { Document } from '@model/Document'

export interface ContentRendererState {
  containerWidth: number | null
}

/**
 * A generic interface for components displaying {@link DocumentContent | document content}.
 *
 * @public
 */
export interface ContentRendererProps {
  /**
   * The {@link (Bridge:class)} instance.
   *
   * @remarks This property MUST NOT be changed after instantiation.
   */
  bridge: Bridge
  /**
   * The {@link DocumentContent | document content} to display.
   */
  documentContent: DocumentContent
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
   * Apply padding to the {@link ContentRendererProps.style | `style`} prop instead.
   */
  contentContainerStyle?: StyleProp<ViewStyle>
}

export const contentRendererStyles = StyleSheet.create({
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
export abstract class ContentRenderer<
  P extends ContentRendererProps,
  S extends ContentRendererState = ContentRendererState
> extends PureComponent<P, S> {
  public static propTypes: Record<keyof ContentRendererProps, any> = {
    bridge: PropTypes.instanceOf(Bridge).isRequired,
    style: ViewPropTypes.style,
    contentContainerStyle: ViewPropTypes.style,
    textStyle: PropTypes.any,
    documentContent: DocumentContentPropType.isRequired,
  }

  protected genService: Gen.Service
  protected doc: Document

  public constructor(props: P) {
    super(props)
    const { bridge } = props
    invariant(bridge != null, 'bridge prop is required')
    invariant(bridge instanceof Bridge, 'bridge prop must be an instance of Bridge class')
    this.doc = new Document(props.documentContent)
    this.genService = props.bridge.getGenService()
  }

  public componentDidUpdate(oldProps: P) {
    invariant(oldProps.bridge === this.props.bridge, 'bridge prop cannot be changed after instantiation')
  }

  protected handleOnContainerLayout = (layoutEvent: LayoutChangeEvent) => {
    this.setState({
      containerWidth: layoutEvent.nativeEvent.layout.width,
    })
  }
}
