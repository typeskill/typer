import React, { Component } from 'react'
import { DocumentRenderer, DocumentRendererProps, DocumentRendererState } from './DocumentRenderer'
import { BlockAssembler } from '@model/BlockAssembler'
import { ScrollView, View } from 'react-native'
import { Images } from '@core/Images'

/**
 * A set of definitions relative to {@link (Print:interface)} component.

 * @public
 */
declare namespace Print {
  /**
   * {@link (Print:interface)} properties.
   */
  export type Props<ImageSource> = DocumentRendererProps<ImageSource>
}

type PrintState = DocumentRendererState

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Print extends DocumentRenderer<Print.Props<any>> {
  public static propTypes = DocumentRenderer.propTypes
  public static defaultProps = DocumentRenderer.defaultProps

  public state: PrintState = {
    containerWidth: null,
  }

  public render() {
    this.assembler = new BlockAssembler(this.props.document)
    return (
      <ScrollView style={this.getComponentStyles()}>
        <View style={this.getContentContainerStyles()}>
          <View style={this.getDocumentStyles()} onLayout={this.handleOnContainerLayout}>
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
interface Print {
  new <ImageSource = Images.StandardSource>(props: Print.Props<ImageSource>, context?: any): Component<
    Print.Props<ImageSource>
  >
}
const Print = _Print as Print

export { Print }
