import React, { PureComponent, ComponentType, ReactNode } from 'react'
import { DocumentPropType, TextTransformSpecsType } from './types'
import PropTypes from 'prop-types'
import { Document } from '@model/document'
import {
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  ViewPropTypes,
  LayoutChangeEvent,
  ScrollViewProps,
  ScrollView,
  View,
} from 'react-native'
import { BlockAssembler } from '@model/BlockAssembler'
import { genericStyles, overridePadding } from './styles'
import { boundMethod } from 'autobind-decorator'
import { Block } from '@model/Block'
import { GenericBlockView } from './GenericBlockView'
import { Images } from '@core/Images'
import { defaults } from './defaults'
import { Transforms } from '@core/Transforms'

export interface DocumentRendererState {
  containerWidth: number | null
}

/**
 * A generic interface for components displaying {@link Document | document}.
 *
 * @remarks There are 3 styles props:
 *
 * ```
 * +------------------------------+
 * | style (ScrollView)           |
 * | +--------------------------+ |
 * | | contentContainerStyle    | |
 * | | +----------------------+ | |
 * | | | documentStyle        | | |
 * | | |                      | | |
 * ```
 *
 * @public
 */
export interface DocumentRendererProps<ImageSource> {
  /**
   * The {@link Document | document} to display.
   */
  document: Document

  /**
   * The image component to render.
   *
   * @remarks The component MUST fit within the passed {@link Images.ComponentProps.printDimensions} prop.
   */
  ImageComponent?: Images.Component<ImageSource>

  /**
   * A collection of text transforms.
   */
  textTransformSpecs?: Transforms.Specs<'text'>

  /**
   * Default text style.
   */
  textStyle?: StyleProp<TextStyle>

  /**
   * The max width of a media block.
   *
   * @remarks If the container width is smaller than this width, the first will be used to frame media.
   */
  maxMediaBlockWidth?: number

  /**
   * The max height of a media block.
   */
  maxMediaBlockHeight?: number

  /**
   * The spacing unit.
   *
   * @remarks It is used:
   *
   * - Between two adjacent blocks;
   * - Between container and document print.
   */
  spacing?: number

  /**
   * Component style.
   */
  style?: StyleProp<ViewStyle>

  /**
   * Style applied to the content container.
   *
   * @remarks This prop MUST NOT contain padding or margin rules. Such spacing rules will be zero-ed.
   * Instead, {@link DocumentRendererProps.spacing | `spacing`} prop will add spacing between the edge of the scrollview and container.
   */
  contentContainerStyle?: StyleProp<ViewStyle>

  /**
   * Styles applied to the closest view encompassing rich content.
   *
   * @remarks This prop MUST NOT contain padding rules. Such padding rules will be zero-ed. Instead, use margin rules.
   */
  documentStyle?: StyleProp<ViewStyle>
  /**
   * Any {@link react-native#ScrollView} props you wish to pass.
   *
   * @remarks
   *
   * - Do not pass `style` prop as it will be overriden by this component `style` props;
   * - Do not pass `keyboardShouldPersistTaps` because it will be forced to `"always"`.
   */
  scrollViewProps?: ScrollViewProps
  /**
   * The component to replace RN default {@link react-native#ScrollView}.
   */
  ScrollView?: ComponentType<any>
}

const contentRendererStyles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  documentStyle: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
})

/**
 * @internal
 */
export abstract class DocumentRenderer<
  P extends DocumentRendererProps<any>,
  S extends DocumentRendererState = DocumentRendererState
> extends PureComponent<P, S> {
  public static propTypes: Record<keyof DocumentRendererProps<any>, any> = {
    document: DocumentPropType.isRequired,
    ImageComponent: PropTypes.func,
    style: ViewPropTypes.style,
    contentContainerStyle: ViewPropTypes.style,
    documentStyle: ViewPropTypes.style,
    textStyle: PropTypes.any,
    spacing: PropTypes.number,
    maxMediaBlockHeight: PropTypes.number,
    maxMediaBlockWidth: PropTypes.number,
    textTransformSpecs: TextTransformSpecsType,
    ScrollView: PropTypes.func,
    scrollViewProps: PropTypes.object,
  }

  public static defaultProps: Partial<Record<keyof DocumentRendererProps<any>, any>> = {
    ImageComponent: defaults.ImageComponent,
    spacing: defaults.spacing,
    textTransformSpecs: defaults.textTransformsSpecs,
  }

  protected assembler: BlockAssembler

  public constructor(props: P) {
    super(props)
    this.assembler = new BlockAssembler(props.document)
  }

  private getSpacing() {
    return this.props.spacing as number
  }

  private handleOnContainerLayout = (layoutEvent: LayoutChangeEvent) => {
    this.setState({
      containerWidth: layoutEvent.nativeEvent.layout.width,
    })
  }

  private getComponentStyles(): StyleProp<ViewStyle> {
    return [contentRendererStyles.scroll, this.props.style]
  }

  private getContentContainerStyles(): StyleProp<ViewStyle> {
    const padding = this.getSpacing()
    return [contentRendererStyles.contentContainer, this.props.contentContainerStyle, overridePadding(padding)]
  }

  private getDocumentStyles(): StyleProp<ViewStyle> {
    return [contentRendererStyles.documentStyle, this.props.documentStyle, genericStyles.zeroPadding]
  }

  protected getBlockStyle(block: Block) {
    if (block.isLast()) {
      return undefined
    }
    return {
      marginBottom: this.getSpacing(),
    }
  }

  @boundMethod
  protected renderBlockView(block: Block) {
    const { textStyle, maxMediaBlockHeight, maxMediaBlockWidth, textTransformSpecs, ImageComponent } = this.props
    const { descriptor } = block
    const key = `block-view-${descriptor.kind}-${descriptor.blockIndex}`
    return (
      <GenericBlockView
        blockStyle={this.getBlockStyle(block)}
        maxMediaBlockHeight={maxMediaBlockHeight}
        maxMediaBlockWidth={maxMediaBlockWidth}
        key={key}
        contentWidth={this.state.containerWidth}
        textStyle={textStyle}
        descriptor={descriptor}
        ImageComponent={ImageComponent as Images.Component<any>}
        textTransformSpecs={textTransformSpecs as Transforms.Specs}
      />
    )
  }

  protected renderRoot(children: ReactNode) {
    const { scrollViewProps, ScrollView: UserScrollView } = this.props
    const ScrollViewComponent = (UserScrollView || ScrollView) as typeof ScrollView
    return (
      <ScrollViewComponent {...scrollViewProps} style={this.getComponentStyles()} keyboardShouldPersistTaps="always">
        <View style={this.getContentContainerStyles()}>
          <View style={this.getDocumentStyles()} onLayout={this.handleOnContainerLayout}>
            {children}
          </View>
        </View>
      </ScrollViewComponent>
    )
  }
}
