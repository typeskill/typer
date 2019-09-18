import React, { PureComponent } from 'react'
import { DocumentPropType, TextTransformSpecsType } from './types'
import PropTypes from 'prop-types'
import { Document } from '@model/document'
import { StyleSheet, StyleProp, ViewStyle, TextStyle, ViewPropTypes, LayoutChangeEvent } from 'react-native'
import { BlockAssembler } from '@model/BlockAssembler'
import { genericStyles } from './styles'
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
   * @remarks If the container width is smaller then this width, the first will be used to frame media.
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
   * - between two adjacent blocks;
   * - to add padding between the container and the rendered document.
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
   * Apply padding to the {@link DocumentRendererProps.style | `style`} prop instead.
   */
  contentContainerStyle?: StyleProp<ViewStyle>
}

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
  P extends DocumentRendererProps<any>,
  S extends DocumentRendererState = DocumentRendererState
> extends PureComponent<P, S> {
  public static propTypes: Record<keyof DocumentRendererProps<any>, any> = {
    document: DocumentPropType.isRequired,
    ImageComponent: PropTypes.func,
    style: ViewPropTypes.style,
    contentContainerStyle: ViewPropTypes.style,
    textStyle: PropTypes.any,
    spacing: PropTypes.number,
    maxMediaBlockHeight: PropTypes.number,
    maxMediaBlockWidth: PropTypes.number,
    textTransformSpecs: TextTransformSpecsType,
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
    return this.props.spacing
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
    return [contentRendererStyles.root, { padding: this.getSpacing() }, this.props.contentContainerStyle]
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
}
