import React, { ComponentClass } from 'react'
import { ContentRenderer, ContentRendererProps, ContentRendererState } from './ContentRenderer'
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
  export type Props<D> = ContentRendererProps<D>
}

type PrintState = ContentRendererState

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Print<D> extends ContentRenderer<D, Print.Props<D>> {
  public static propTypes = ContentRenderer.propTypes

  public state: PrintState = {
    containerWidth: null,
  }

  public componentDidUpdate(oldProps: Print.Props<D>) {
    super.componentDidUpdate(oldProps)
  }

  @boundMethod
  private renderBlockView({ descriptor }: Block) {
    const { textStyle } = this.props
    const key = `block-view-${descriptor.kind}-${descriptor.blockIndex}`
    return (
      <GenericBlockView
        key={key}
        contentWidth={this.state.containerWidth}
        textStyle={textStyle}
        imageLocatorService={this.genService.imageLocator}
        descriptor={descriptor}
        textTransforms={this.genService.textTransforms}
      />
    )
  }

  public render() {
    this.doc = new Document(this.props.documentContent)
    return (
      <ScrollView style={this.getScrollStyles()}>
        <View style={this.getRootStyles()}>
          <View style={this.getContainerStyles()} onLayout={this.handleOnContainerLayout}>
            {this.doc.getBlocks().map(this.renderBlockView)}
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
type Print<D> = ComponentClass<Print.Props<D>>
const Print = _Print as Print<any>

export { Print }
