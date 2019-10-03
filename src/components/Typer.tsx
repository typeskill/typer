import React, { Component } from 'react'
import { Document } from '@model/document'
import { boundMethod } from 'autobind-decorator'
import PropTypes from 'prop-types'
import { GenericBlockInput, FocusableInput } from './GenericBlockInput'
import { Block } from '@model/Block'
import { DocumentProvider, BlockController } from './BlockController'
import { BlockAssembler } from '@model/BlockAssembler'
import { SelectionShape, Selection } from '@delta/Selection'
import { DocumentRenderer, DocumentRendererProps } from './DocumentRenderer'
import { Bridge, BridgeStatic } from '@core/Bridge'
import invariant from 'invariant'
import { ImageHooksType } from './types'
import { defaults } from './defaults'
import { Images } from '@core/Images'
import { Transforms } from '@core/Transforms'
import equals from 'ramda/es/equals'
import { Platform } from 'react-native'

interface TyperState {
  containerWidth: number | null
  overridingSelection: SelectionShape | null
}

/**
 * A set of definitions relative to {@link (Typer:class)} component.
 *
 * @public
 */
export declare namespace Typer {
  /**
   * {@link (Typer:class)} properties.
   */
  export interface Props<ImageSource> extends DocumentRendererProps<ImageSource> {
    /**
     * The {@link (Bridge:interface)} instance.
     *
     * @remarks This property MUST NOT be changed after instantiation.
     */
    bridge: Bridge<ImageSource>

    /**
     * Callbacks on image insertion and deletion.
     */
    imageHooks?: Images.Hooks<ImageSource>

    /**
     * Handler to receive {@link Document| document} updates.
     *
     */
    onDocumentUpdate?: (nextDocumentContent: Document) => void

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

    /**
     * Disable selection overrides.
     *
     * @remarks
     *
     * In some instances, the typer will override active text selections. This will happen when user press the edge of a media block:
     * the selection will be overriden in order to select the preceding or following text input closest selectable unit.
     *
     * However, some versions of React Native have an Android bug which can trigger a `setSpan` error. If such errors occur, you should disable selection overrides.
     * {@link https://github.com/facebook/react-native/issues/25265}
     * {@link https://github.com/facebook/react-native/issues/17236}
     * {@link https://github.com/facebook/react-native/issues/18316}
     */
    disableSelectionOverrides?: boolean
    /**
     * By default, when user select text and apply transforms, the selection will be overriden to stay the same and allow user to apply multiple transforms.
     * This is the normal behavior on iOS, but not on Android. Typeksill will by default enforce this behavior on Android too.
     * However, when this prop is set to `true`, such behavior will be prevented on Android.
     */
    androidDisableMultipleAttributeEdits?: boolean
  }
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Typer extends DocumentRenderer<Typer.Props<any>, TyperState> implements DocumentProvider {
  public static displayName = 'Typer'
  public static propTypes: Record<keyof Typer.Props<any>, any> = {
    ...DocumentRenderer.propTypes,
    bridge: PropTypes.instanceOf(BridgeStatic).isRequired,
    onDocumentUpdate: PropTypes.func,
    debug: PropTypes.bool,
    underlayColor: PropTypes.string,
    readonly: PropTypes.bool,
    imageHooks: ImageHooksType,
    disableSelectionOverrides: PropTypes.bool,
    androidDisableMultipleAttributeEdits: PropTypes.bool,
  }

  public static defaultProps: Partial<Record<keyof Typer.Props<any>, any>> = {
    ...DocumentRenderer.defaultProps,
    readonly: false,
    debug: false,
    underlayColor: defaults.underlayColor,
    imageHooks: defaults.imageHooks,
  }

  private focusedBlock = React.createRef<GenericBlockInput<any>>()

  public state: TyperState = {
    containerWidth: null,
    overridingSelection: null,
  }

  public constructor(props: Typer.Props<any>) {
    super(props)
  }

  @boundMethod
  private clearSelection() {
    this.setState({ overridingSelection: null })
  }

  public getDocument() {
    return this.props.document
  }

  public getImageHooks() {
    return this.props.imageHooks as Images.Hooks<any>
  }

  public async updateDocument(documentUpdate: Document): Promise<void> {
    return (
      (this.props.onDocumentUpdate && this.props.document && this.props.onDocumentUpdate(documentUpdate)) ||
      Promise.resolve()
    )
  }

  @boundMethod
  private renderBlockInput(block: Block) {
    const descriptor = block.descriptor
    const { overridingSelection } = this.state
    const {
      textStyle,
      debug,
      underlayColor,
      maxMediaBlockHeight,
      maxMediaBlockWidth,
      ImageComponent,
      textTransformSpecs,
      disableSelectionOverrides,
    } = this.props
    const { selectedTextAttributes } = this.props.document
    const key = `block-input-${descriptor.kind}-${descriptor.blockIndex}`
    // TODO use weak map to memoize controller
    const controller = new BlockController(block, this)
    const isFocused = block.isFocused(this.props.document)
    return (
      <GenericBlockInput
        key={key}
        ref={isFocused ? this.focusedBlock : undefined}
        underlayColor={underlayColor}
        blockStyle={this.getBlockStyle(block)}
        hightlightOnFocus={!!debug}
        isFocused={isFocused}
        controller={controller}
        contentWidth={this.state.containerWidth}
        textStyle={textStyle}
        ImageComponent={ImageComponent as Images.Component<any>}
        descriptor={descriptor}
        maxMediaBlockHeight={maxMediaBlockHeight}
        maxMediaBlockWidth={maxMediaBlockWidth}
        blockScopedSelection={block.getBlockScopedSelection(this.props.document.currentSelection)}
        overridingScopedSelection={
          isFocused && overridingSelection ? block.getBlockScopedSelection(overridingSelection) : null
        }
        textAttributesAtCursor={selectedTextAttributes}
        disableSelectionOverrides={disableSelectionOverrides}
        textTransformSpecs={textTransformSpecs as Transforms.Specs}
      />
    )
  }

  public overrideSelection(overridingSelection: SelectionShape) {
    this.setState({ overridingSelection })
  }

  public componentDidMount() {
    const sheetEventDom = this.props.bridge.getSheetEventDomain()
    sheetEventDom.addApplyTextTransformToSelectionListener(this, async (attributeName, attributeValue) => {
      const currentSelection = this.props.document.currentSelection
      await this.updateDocument(this.assembler.applyTextTransformToSelection(attributeName, attributeValue))
      // Force the current selection to allow multiple edits on Android.
      if (
        Platform.OS === 'android' &&
        Selection.fromShape(currentSelection).length() > 0 &&
        !this.props.androidDisableMultipleAttributeEdits
      ) {
        this.overrideSelection(this.props.document.currentSelection)
      }
    })
    sheetEventDom.addInsertOrReplaceAtSelectionListener(this, async element => {
      await this.updateDocument(this.assembler.insertOrReplaceAtSelection(element))
      if (element.type === 'image') {
        const { onImageAddedEvent } = this.props.imageHooks as Images.Hooks<any>
        onImageAddedEvent && onImageAddedEvent(element.description)
      }
    })
  }

  public componentWillUnmount() {
    this.props.bridge.getSheetEventDomain().release(this)
  }

  public async componentDidUpdate(oldProps: Typer.Props<any>) {
    invariant(oldProps.bridge === this.props.bridge, 'bridge prop cannot be changed after instantiation')
    const currentSelection = this.props.document.currentSelection
    const currentSelectedTextAttributes = this.props.document.selectedTextAttributes
    if (oldProps.document.currentSelection !== currentSelection) {
      const nextDocument = this.assembler.updateTextAttributesAtSelection()
      // update text attributes when necessary
      if (!equals(nextDocument.selectedTextAttributes, currentSelectedTextAttributes)) {
        await this.updateDocument(nextDocument)
      }
    }
    if (this.state.overridingSelection !== null) {
      setTimeout(this.clearSelection, Platform.select({ ios: 100, default: 0 }))
    }
  }

  public focus = () => {
    this.focusedBlock.current && this.focusedBlock.current.focus()
  }

  public render() {
    this.assembler = new BlockAssembler(this.props.document)
    const { readonly } = this.props
    return this.renderRoot(this.assembler.getBlocks().map(readonly ? this.renderBlockView : this.renderBlockInput))
  }
}

exports.Typer = _Typer

/**
 * A component solely responsible for editing {@link Document | document}.
 *
 * @remarks This component is [controlled](https://reactjs.org/docs/forms.html#controlled-components).
 *
 * You MUST provide:
 *
 * - A {@link Document | `document`} prop to render contents. You can initialize it with {@link buildEmptyDocument};
 * - A {@link (Bridge:interface) | `bridge` } prop to share document-related events with external controls;
 *
 * You SHOULD provide:
 *
 * - A `onDocumentUpdate` prop to update its state.
 *
 * @public
 *
 */
export declare class Typer<ImageSource = Images.StandardSource> extends Component<Typer.Props<ImageSource>>
  implements FocusableInput {
  focus: () => void
}
