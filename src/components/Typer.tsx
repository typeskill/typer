import invariant from 'invariant'
import React, { PureComponent, ComponentClass } from 'react'
import {
  StyleSheet,
  StyleProp,
  TextStyle,
  ViewStyle,
  ViewPropTypes,
  ScrollView,
  View,
  LayoutChangeEvent,
} from 'react-native'
import { Bridge } from '@core/Bridge'
import { DocumentContent } from '@model/documents'
import { boundMethod } from 'autobind-decorator'
import PropTypes from 'prop-types'
import { DocumentContentPropType } from './types'
import { GenericBlockController } from './GenericBlockController'
import mergeLeft from 'ramda/es/mergeLeft'
import { Block } from '@model/Block'
import { DocumentProvider, DocumentController } from './DocumentController'
import { Document } from '@model/Document'
import { SelectionShape, Selection } from '@delta/Selection'
import { ScrollIntoView, wrapScrollView } from 'react-native-scroll-into-view'
import { Gen } from '@core/Gen'

const AutoScrollView = wrapScrollView(ScrollView)

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  /**
   * As of React Native 0.60, merging padding algorithm doesn't
   * allow more specific spacing attributes to override more
   * generic ones. As such, we must override all.
   */
  overridingContentStyles: {
    margin: 0,
    marginBottom: 0,
    marginEnd: 0,
    marginHorizontal: 0,
    marginLeft: 0,
    marginRight: 0,
    marginStart: 0,
    marginTop: 0,
    marginVertical: 0,
    padding: 0,
    paddingBottom: 0,
    paddingEnd: 0,
    paddingHorizontal: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingStart: 0,
    paddingTop: 0,
    paddingVertical: 0,
  },
  root: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'stretch',
    padding: 10,
  },
})

interface SheetState {
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
  export interface Props<D extends {} = {}> {
    /**
     * The {@link (Bridge:class)} instance.
     *
     * @remarks This property MUST NOT be changed after instantiation.
     */
    bridge: Bridge
    /**
     * The {@link DocumentContent | document content} to display.
     */
    documentContent: DocumentContent
    /**
     * Handler to receive {@link DocumentContent | document content} updates.
     *
     * @remarks This callback is expected to return a promise. This promise MUST resolve when the update had been proceeded.
     */
    onDocumentContentUpdate?: (nextDocumentContent: DocumentContent) => Promise<void>

    /**
     * Component styles.
     */
    style?: StyleProp<ViewStyle>
    /**
     * Default text style.
     */
    textStyle?: StyleProp<TextStyle>
    /**
     * Style applied to the content container.
     *
     * @remarks This prop MUST NOT contain padding or margin rules. Such spacing rules will be zero-ed.
     * Apply padding to the {@link (Typer:namespace).Props.style | `style`} prop instead.
     */
    contentContainerStyle?: StyleProp<ViewStyle>
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
class _Typer extends PureComponent<Typer.Props, SheetState> implements DocumentProvider {
  public static propTypes: Record<keyof Typer.Props, any> = {
    bridge: PropTypes.instanceOf(Bridge).isRequired,
    style: ViewPropTypes.style,
    contentContainerStyle: ViewPropTypes.style,
    textStyle: PropTypes.any,
    documentContent: DocumentContentPropType.isRequired,
    onDocumentContentUpdate: PropTypes.func,
    debug: PropTypes.bool,
    underlayColor: PropTypes.string,
  }

  public static defaultProps: Partial<Typer.Props> = {}

  private genService: Gen.Service
  private doc: Document

  public state: SheetState = {
    containerWidth: null,
    overridingScopedSelection: null,
  }

  public constructor(props: Typer.Props) {
    super(props)
    const { bridge } = props
    invariant(bridge != null, 'bridge prop is required')
    invariant(bridge instanceof Bridge, 'bridge prop must be an instance of Bridge class')
    this.doc = new Document(props.documentContent)
    this.genService = props.bridge.getGenService()
  }

  @boundMethod
  private clearSelection() {
    this.setState({ overridingScopedSelection: null })
  }

  private handleOnContainerLayout = (layoutEvent: LayoutChangeEvent) => {
    this.setState({
      containerWidth: layoutEvent.nativeEvent.layout.width,
    })
  }

  public updateDocumentContent(documentUpdate: Partial<DocumentContent>): Promise<void> {
    return (
      (this.props.onDocumentContentUpdate &&
        this.props.documentContent &&
        this.props.onDocumentContentUpdate(mergeLeft(documentUpdate, this.props.documentContent) as DocumentContent)) ||
      Promise.resolve()
    )
  }

  public getRendererService() {
    return this.genService
  }

  public getDocumentContent() {
    return this.props.documentContent
  }

  @boundMethod
  private renderBlockController(block: Block) {
    const descriptor = block.descriptor
    const { overridingScopedSelection: overridingSelection } = this.state
    const { textStyle, debug } = this.props
    const { selectedTextAttributes } = this.props.documentContent
    const key = `block-${descriptor.kind}-${descriptor.blockIndex}`
    // TODO use weak map to memoize controller
    const controller = new DocumentController(block, this)
    const isFocused = block.isFocused(this.props.documentContent)
    return (
      <ScrollIntoView enabled={isFocused} key={key}>
        <GenericBlockController
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

  public async componentDidUpdate(oldProps: Typer.Props) {
    invariant(oldProps.bridge === this.props.bridge, 'bridge prop cannot be changed after instantiation')
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
      <AutoScrollView style={[styles.scroll, this.props.style]} keyboardShouldPersistTaps="always">
        <View style={styles.root}>
          <View
            style={[styles.contentContainer, this.props.contentContainerStyle, styles.overridingContentStyles]}
            onLayout={this.handleOnContainerLayout}
          >
            {this.doc.getBlocks().map(this.renderBlockController)}
          </View>
        </View>
      </AutoScrollView>
    )
  }
}

/**
 * A component solely responsible for editing {@link DocumentContent}.
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
