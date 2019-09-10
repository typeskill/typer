import React, { ComponentClass } from 'react'
import { ScrollView, View } from 'react-native'
import { Document } from '@model/document'
import { boundMethod } from 'autobind-decorator'
import PropTypes from 'prop-types'
import { GenericBlockInput } from './GenericBlockInput'
import mergeLeft from 'ramda/es/mergeLeft'
import { Block } from '@model/Block'
import { DocumentProvider, BlockController } from './BlockController'
import { BlockAssembler } from '@model/BlockAssembler'
import { SelectionShape, Selection } from '@delta/Selection'
import { ScrollIntoView, wrapScrollView } from 'react-native-scroll-into-view'
import { DocumentRenderer, DocumentRendererProps } from './DocumentRenderer'

const AutoScrollView = wrapScrollView(ScrollView)

interface TyperState {
  containerWidth: number | null
  overridingScopedSelection: SelectionShape | null
}

/**
 * A set of definitions relative to {@link (Typer:type)} component.
 *
 * @public
 */
declare namespace Typer {
  /**
   * {@link (Typer:type)} properties.
   */
  export interface Props extends DocumentRendererProps<any> {
    /**
     * Handler to receive {@link Document| document} updates.
     *
     * @remarks This callback is expected to return a promise. This promise MUST resolve when the update had been proceeded.
     */
    onDocumentUpdate?: (nextDocumentContent: Document) => Promise<void>

    /**
     * Disable edition.
     */
    readonly?: boolean

    /**
     * Customize the color of image controls upon activation.
     */
    underlayColor?: string

    /**
     * In debug mode, active block will be highlighted.
     */
    debug?: boolean
  }
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Typer extends DocumentRenderer<Typer.Props, TyperState> implements DocumentProvider {
  public static propTypes: Record<keyof Typer.Props, any> = {
    ...DocumentRenderer.propTypes,
    onDocumentUpdate: PropTypes.func,
    debug: PropTypes.bool,
    underlayColor: PropTypes.string,
    readonly: PropTypes.bool,
  }

  public state: TyperState = {
    containerWidth: null,
    overridingScopedSelection: null,
  }

  public constructor(props: Typer.Props) {
    super(props)
  }

  @boundMethod
  private clearSelection() {
    this.setState({ overridingScopedSelection: null })
  }

  public getGenService() {
    return this.genService
  }

  public getDocument() {
    return this.props.document
  }

  public updateDocument(documentUpdate: Partial<Document>): Promise<void> {
    return (
      (this.props.onDocumentUpdate &&
        this.props.document &&
        this.props.onDocumentUpdate(mergeLeft(documentUpdate, this.props.document) as Document)) ||
      Promise.resolve()
    )
  }

  @boundMethod
  private renderBlockInput(block: Block) {
    const descriptor = block.descriptor
    const { overridingScopedSelection: overridingSelection } = this.state
    const { textStyle, debug, underlayColor, maxMediaBlockHeight, maxMediaBlockWidth } = this.props
    const { selectedTextAttributes } = this.props.document
    const key = `block-input-${descriptor.kind}-${descriptor.blockIndex}`
    // TODO use weak map to memoize controller
    const controller = new BlockController(block, this)
    const isFocused = block.isFocused(this.props.document)
    return (
      <ScrollIntoView enabled={isFocused} key={key}>
        <GenericBlockInput
          underlayColor={underlayColor}
          blockStyle={this.getBlockStyle(block)}
          hightlightOnFocus={!!debug}
          isFocused={isFocused}
          controller={controller}
          contentWidth={this.state.containerWidth}
          textStyle={textStyle}
          imageLocatorService={this.genService.imageLocator}
          descriptor={descriptor}
          maxMediaBlockHeight={maxMediaBlockHeight}
          maxMediaBlockWidth={maxMediaBlockWidth}
          blockScopedSelection={block.getBlockScopedSelection(this.props.document)}
          overridingScopedSelection={isFocused ? overridingSelection : null}
          textAttributesAtCursor={selectedTextAttributes}
          textTransforms={this.genService.textTransforms}
        />
      </ScrollIntoView>
    )
  }
  public componentDidMount() {
    const sheetEventDom = this.props.bridge.getSheetEventDomain()
    sheetEventDom.addApplyTextTransformToSelectionListener(this, async (attributeName, attributeValue) => {
      const currentSelection = this.props.document.currentSelection
      await this.updateDocument(this.assembler.applyTextTransformToSelection(attributeName, attributeValue))
      // Force the current selection to allow multiple edits.
      if (Selection.fromShape(currentSelection).length() > 0) {
        this.setState({ overridingScopedSelection: this.assembler.getActiveBlockScopedSelection() })
      }
    })
    sheetEventDom.addInsertOrReplaceAtSelectionListener(this, async element => {
      await this.updateDocument(this.assembler.insertOrReplaceAtSelection(element))
      if (element.type === 'image') {
        const { onImageAddedEvent } = this.genService.imageLocator
        onImageAddedEvent && onImageAddedEvent(element.description)
      }
    })
  }

  public componentWillUnmount() {
    this.props.bridge.getSheetEventDomain().release(this)
  }

  public async componentDidUpdate(oldProps: Typer.Props) {
    super.componentDidUpdate(oldProps)
    const currentSelection = this.props.document.currentSelection
    if (oldProps.document.currentSelection !== currentSelection) {
      await this.updateDocument(this.assembler.updateTextAttributesAtSelection())
    }
    if (this.state.overridingScopedSelection !== null) {
      setTimeout(this.clearSelection, 0)
    }
  }

  public render() {
    this.assembler = new BlockAssembler(this.props.document)
    const { readonly } = this.props
    return (
      <AutoScrollView style={this.getScrollStyles()} keyboardShouldPersistTaps="always">
        <View style={this.getRootStyles()}>
          <View style={this.getContainerStyles()} onLayout={this.handleOnContainerLayout}>
            {this.assembler.getBlocks().map(readonly ? this.renderBlockView : this.renderBlockInput)}
          </View>
        </View>
      </AutoScrollView>
    )
  }
}

/**
 * A component solely responsible for editing {@link Document | document}.
 *
 * @remarks This component is [controlled](https://reactjs.org/docs/forms.html#controlled-components).
 *
 * You MUST provide:
 *
 * - A {@link Document | `document`} prop to render contents. You can initialize it with {@link buildEmptyDocument};
 * - A {@link Bridge | `bridge` } prop to share document-related events with external controls;
 *
 * You SHOULD provide:
 *
 * - A `onDocumentUpdate` prop to update its state.
 *
 *
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
type Typer = ComponentClass<Typer.Props>
const Typer = _Typer as Typer

export { Typer }
