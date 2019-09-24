import { Component } from 'react'
import { DocumentRenderer, DocumentRendererProps, DocumentRendererState } from './DocumentRenderer'
import { BlockAssembler } from '@model/BlockAssembler'
import { Images } from '@core/Images'
import { boundMethod } from 'autobind-decorator'

/**
 * A set of definitions relative to {@link (Print:class)} component.

 * @public
 */
export declare namespace Print {
  /**
   * {@link (Print:class)} properties.
   */
  export type Props<ImageSource> = DocumentRendererProps<ImageSource>
}

type PrintState = DocumentRendererState

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Print extends DocumentRenderer<Print.Props<any>> {
  public static displayName = 'Print'
  public static propTypes = DocumentRenderer.propTypes
  public static defaultProps = DocumentRenderer.defaultProps

  public state: PrintState = {
    containerWidth: null,
  }

  public render() {
    this.assembler = new BlockAssembler(this.props.document)
    return this.renderRoot(this.assembler.getBlocks().map(this.renderBlockView))
  }
}

exports.Print = _Print

/**
 * A component solely responsible for viewing {@link Document | document}.
 *
 * @public
 *
 */
export declare class Print<ImageSource = Images.StandardSource> extends Component<Print.Props<ImageSource>> {}
