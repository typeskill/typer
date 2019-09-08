import React, { ComponentClass } from 'react'
import { DocumentRenderer, DocumentRendererProps, DocumentRendererState } from './DocumentRenderer'
import { BlockAssembler } from '@model/BlockAssembler'
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
  export type Props<D> = DocumentRendererProps<D>
}

type PrintState = DocumentRendererState

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Print<D> extends DocumentRenderer<D, Print.Props<D>> {
  public static propTypes = DocumentRenderer.propTypes

  public state: PrintState = {
    containerWidth: null,
  }

  public componentDidUpdate(oldProps: Print.Props<D>) {
    super.componentDidUpdate(oldProps)
  }

  @boundMethod
  private renderBlockView(block: Block) {
    const { textStyle } = this.props
    const { descriptor } = block
    const key = `block-view-${descriptor.kind}-${descriptor.blockIndex}`
    return (
      <GenericBlockView
        blockStyle={this.getBlockStyle(block)}
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
    this.assembler = new BlockAssembler(this.props.document)
    return (
      <ScrollView style={this.getScrollStyles()}>
        <View style={this.getRootStyles()}>
          <View style={this.getContainerStyles()} onLayout={this.handleOnContainerLayout}>
            {this.assembler.getBlocks().map(this.renderBlockView)}
          </View>
        </View>
      </ScrollView>
    )
  }
}

/**
 * A component solely responsible for viewing {@link Document | document}.
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
