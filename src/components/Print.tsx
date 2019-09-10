import React, { ComponentClass } from 'react'
import { DocumentRenderer, DocumentRendererProps, DocumentRendererState } from './DocumentRenderer'
import { BlockAssembler } from '@model/BlockAssembler'
import { ScrollView, View } from 'react-native'

/**
 * A set of definitions relative to {@link (Print:type)} component.

 * @public
 */
declare namespace Print {
  /**
   * {@link (Print:type)} properties.
   */
  export type Props = DocumentRendererProps<any>
}

type PrintState = DocumentRendererState

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Print extends DocumentRenderer<Print.Props> {
  public static propTypes = DocumentRenderer.propTypes
  public static defaultProps = DocumentRenderer.defaultProps

  public state: PrintState = {
    containerWidth: null,
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
type Print = ComponentClass<Print.Props>
const Print = _Print as Print

export { Print }
