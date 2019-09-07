import React, { ComponentClass } from 'react'
import { ContentRenderer, ContentRendererProps, contentRendererStyles } from './ContentRenderer'
import { Document } from '@model/Document'
import { ScrollView, View } from 'react-native'
import { boundMethod } from 'autobind-decorator'
import { Block } from '@model/Block'
import { GenericBlockView } from './GenericBlockView'

/**
 * A set of definitions relative to {@link (Print:type)} component.

 * @public
 */
declare namespace Print {
  /**
   * {@link (Print:type)} properties.
   */
  export type Props = ContentRendererProps
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Print extends ContentRenderer<Print.Props> {
  public static propTypes = ContentRenderer.propTypes

  public componentDidUpdate(oldProps: Print.Props) {
    super.componentDidUpdate(oldProps)
  }

  @boundMethod
  private renderBlock(block: Block) {
    const { textStyle } = this.props
    return (
      <GenericBlockView
        contentWidth={this.state.containerWidth}
        textStyle={textStyle}
        imageLocatorService={this.genService.imageLocator}
        descriptor={block.descriptor}
        textTransforms={this.genService.textTransforms}
      />
    )
  }

  public render() {
    this.doc = new Document(this.props.documentContent)
    return (
      <ScrollView style={[contentRendererStyles.scroll, this.props.style]}>
        <View style={contentRendererStyles.root}>
          <View
            style={[
              contentRendererStyles.contentContainer,
              this.props.contentContainerStyle,
              contentRendererStyles.overridingContentStyles,
            ]}
            onLayout={this.handleOnContainerLayout}
          >
            {this.doc.getBlocks().map(this.renderBlock)}
          </View>
        </View>
      </ScrollView>
    )
  }
}

/**
 * A component solely responsible for viewing {@link DocumentContent | document content}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
type Print = ComponentClass<Print.Props>
const Print = _Print as Print

export { Print }
