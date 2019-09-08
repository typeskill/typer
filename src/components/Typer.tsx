import React, { ComponentClass } from 'react'
import { ScrollView, View } from 'react-native'
import { DocumentContent } from '@model/documents'
import { boundMethod } from 'autobind-decorator'
import PropTypes from 'prop-types'
import { GenericBlockInput } from './GenericBlockInput'
import mergeLeft from 'ramda/es/mergeLeft'
import { Block } from '@model/Block'
import { DocumentProvider, DocumentController } from './DocumentController'
import { Document } from '@model/Document'
import { SelectionShape, Selection } from '@delta/Selection'
import { ScrollIntoView, wrapScrollView } from 'react-native-scroll-into-view'
import { ContentRenderer, ContentRendererProps } from './ContentRenderer'

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
  export interface Props<D> extends ContentRendererProps<D> {
    /**
     * Handler to receive {@link DocumentContent | document content} updates.
     *
     * @remarks This callback is expected to return a promise. This promise MUST resolve when the update had been proceeded.
     */
    onDocumentContentUpdate?: (nextDocumentContent: DocumentContent) => Promise<void>

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
class _Typer<D> extends ContentRenderer<D, Typer.Props<D>, TyperState> implements DocumentProvider {
  public static propTypes: Record<keyof Typer.Props<any>, any> = {
    ...ContentRenderer.propTypes,
    onDocumentContentUpdate: PropTypes.func,
    debug: PropTypes.bool,
    underlayColor: PropTypes.string,
  }

  public state: TyperState = {
    containerWidth: null,
    overridingScopedSelection: null,
  }

  public constructor(props: Typer.Props<D>) {
    super(props)
  }

  @boundMethod
  private clearSelection() {
    this.setState({ overridingScopedSelection: null })
  }

  public getGenService() {
    return this.genService
  }

  public getDocumentContent() {
    return this.props.documentContent
  }

  public updateDocumentContent(documentUpdate: Partial<DocumentContent>): Promise<void> {
    return (
      (this.props.onDocumentContentUpdate &&
        this.props.documentContent &&
        this.props.onDocumentContentUpdate(mergeLeft(documentUpdate, this.props.documentContent) as DocumentContent)) ||
      Promise.resolve()
    )
  }

  @boundMethod
  private renderBlockInput(block: Block) {
    const descriptor = block.descriptor
    const { overridingScopedSelection: overridingSelection } = this.state
    const { textStyle, debug } = this.props
    const { selectedTextAttributes } = this.props.documentContent
    const key = `block-input-${descriptor.kind}-${descriptor.blockIndex}`
    // TODO use weak map to memoize controller
    const controller = new DocumentController(block, this)
    const isFocused = block.isFocused(this.props.documentContent)
    return (
      <ScrollIntoView enabled={isFocused} key={key}>
        <GenericBlockInput
          hightlightOnFocus={!!debug}
          isFocused={isFocused}
          controller={controller}
          contentWidth={this.state.containerWidth}
          textStyle={textStyle}
          imageLocatorService={this.genService.imageLocator}
          descriptor={descriptor}
          blockScopedSelection={block.getScopedSelection(this.props.documentContent)}
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
      const currentSelection = this.props.documentContent.currentSelection
      await this.updateDocumentContent(this.doc.applyTextTransformToSelection(attributeName, attributeValue))
      // Force the current selection to allow multiple edits.
      if (Selection.fromShape(currentSelection).length() > 0) {
        this.setState({ overridingScopedSelection: this.doc.getActiveBlockScopedSelection() })
      }
    })
    sheetEventDom.addInsertOrReplaceAtSelectionListener(this, async element => {
      await this.updateDocumentContent(this.doc.insertOrReplaceAtSelection(element))
      if (element.type === 'image') {
        const { onImageAddedEvent } = this.genService.imageLocator
        onImageAddedEvent && onImageAddedEvent(element.description)
      }
    })
  }

  public componentWillUnmount() {
    this.props.bridge.getSheetEventDomain().release(this)
  }

  public async componentDidUpdate(oldProps: Typer.Props<D>) {
    super.componentDidUpdate(oldProps)
    const currentSelection = this.props.documentContent.currentSelection
    if (oldProps.documentContent.currentSelection !== currentSelection) {
      await this.updateDocumentContent(this.doc.updateTextAttributesAtSelection())
    }
    if (this.state.overridingScopedSelection !== null) {
      setTimeout(this.clearSelection, 0)
    }
  }

  public render() {
    this.doc = new Document(this.props.documentContent)
    return (
      <AutoScrollView style={this.getScrollStyles()} keyboardShouldPersistTaps="always">
        <View style={this.getRootStyles()}>
          <View style={this.getContainerStyles()} onLayout={this.handleOnContainerLayout}>
            {this.doc.getBlocks().map(this.renderBlockInput)}
          </View>
        </View>
      </AutoScrollView>
    )
  }
}

/**
 * A component solely responsible for editing {@link DocumentContent | document content}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
type Typer<D> = ComponentClass<Typer.Props<D>>
const Typer = _Typer as Typer<any>

export { Typer }
