import invariant from 'invariant'
import React, { PureComponent, ComponentClass } from 'react'
import { View, StyleSheet, StyleProp, TextStyle, ViewStyle, ViewPropTypes } from 'react-native'
import { Bridge } from '@core/Bridge'
import { DocumentContent } from '@model/document'
import { boundMethod } from 'autobind-decorator'
import PropTypes from 'prop-types'
import { DocumentContentPropType } from './types'
import { GenericBlockController } from './GenericBlockController'
import { BlockDescriptor, groupOpsByBlocks, createScopedContentMerger } from '@model/blocks'
import { Selection } from '@delta/Selection'
import { DocumentDelta } from '@delta/DocumentDelta'
import Delta from 'quill-delta/dist/Delta'
import mergeLeft from 'ramda/es/mergeLeft'
import { mergeAttributesLeft } from '@delta/attributes'
import { buildImageOp } from '@delta/operations'

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignSelf: 'stretch',
    padding: 10,
  },
})

/**
 * A set of definitions relative to {@link (Sheet:type)} component.
 *
 * @public
 */
declare namespace Sheet {
  /**
   * {@link (Sheet:type)} properties.
   */
  export interface Props {
    /**
     * The {@link (Bridge:class)} instance.
     *
     * **Warning** This property cannot be changed after instantiation.
     */
    bridge: Bridge
    /**
     * Default text style.
     */
    textStyle?: StyleProp<TextStyle>
    /**
     * The {@link DocumentContent | document content} to display.
     */
    documentContent: DocumentContent
    /**
     * Handler to receive {@link DocumentContent | document content} updates.
     */
    onDocumentContentUpdate?: (documentContent: DocumentContent) => Promise<void>
    /**
     * Style applied to the container.
     */
    contentContainerStyle?: StyleProp<ViewStyle>
  }
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Sheet extends PureComponent<Sheet.Props> {
  public static propTypes: Record<keyof Sheet.Props, any> = {
    bridge: PropTypes.instanceOf(Bridge).isRequired,
    contentContainerStyle: ViewPropTypes.style,
    textStyle: PropTypes.any,
    documentContent: DocumentContentPropType.isRequired,
    onDocumentContentUpdate: PropTypes.func,
  }

  public constructor(props: Sheet.Props) {
    super(props)
    const { bridge } = this.props
    invariant(bridge != null, 'bridge prop is required')
    invariant(bridge instanceof Bridge, 'bridge prop must be an instance of Bridge class')
  }

  private createScopedContentUpdater = (descriptor: BlockDescriptor) => {
    const merger = createScopedContentMerger(descriptor)
    return (scopedContent: Partial<DocumentContent>) =>
      this.updateDocumentContent(merger(scopedContent, this.props.documentContent))
  }

  private updateDocumentContent(documentUpdate: Partial<DocumentContent>): Promise<void> {
    console.info('DOC UPDATE', documentUpdate)
    return (
      (this.props.onDocumentContentUpdate &&
        this.props.documentContent &&
        this.props.onDocumentContentUpdate(mergeLeft(documentUpdate, this.props.documentContent) as DocumentContent)) ||
      Promise.resolve()
    )
  }

  @boundMethod
  private renderBlockController(descriptor: BlockDescriptor) {
    const { textStyle, bridge } = this.props
    const updateScopedContent = this.createScopedContentUpdater(descriptor)
    console.info('RENDERING', descriptor)
    return (
      <GenericBlockController
        updateScopedContent={updateScopedContent}
        isFocused={false}
        textStyle={textStyle}
        imageLocatorService={bridge.getImageLocator()}
        key={`block-${descriptor.kind}-${descriptor.blockIndex}`}
        descriptor={descriptor}
        grow={true}
        textAttributesAtCursor={this.props.documentContent.textAttributesAtCursor}
        textTransforms={this.props.bridge.getTransforms()}
      />
    )
  }

  public componentDidMount() {
    const sheetEventDom = this.props.bridge.getSheetEventDomain()
    sheetEventDom.addApplyTextTransformToSelectionListener(this, async (attributeName, attributeValue) => {
      const { currentSelection, ops, textAttributesAtCursor } = this.props.documentContent
      const delta = new DocumentDelta(ops)
      const selection = Selection.fromShape(currentSelection)
      // Apply transforms to selection range
      const userAttributes = { [attributeName]: attributeValue }
      const atomicUpdate = delta.applyTextTransformToSelection(selection, attributeName, attributeValue)
      const deltaAttributes = atomicUpdate.delta.getSelectedTextAttributes(selection)
      const mergedCursorAttributes = mergeLeft(userAttributes, textAttributesAtCursor)
      const selectedAttributes = mergeAttributesLeft(deltaAttributes, mergedCursorAttributes)
      await this.updateDocumentContent({
        textAttributesAtCursor: mergedCursorAttributes,
        ops: atomicUpdate.delta.ops,
      })
      this.props.bridge.getSheetEventDomain().notifySelectedTextAttributesChange(selectedAttributes)
    })
    sheetEventDom.addInsertOrReplaceAtSelectionListener(this, async element => {
      if (element.type === 'image') {
        const { onImageAddedEvent } = this.props.bridge.getImageLocator()
        const { ops, currentSelection } = this.props.documentContent
        const selection = Selection.fromShape(currentSelection)
        const delta = new DocumentDelta(ops)
        const diff = new Delta()
          .retain(currentSelection.start)
          .delete(selection.length())
          .insert(buildImageOp(element.description))
        await this.updateDocumentContent({ ops: delta.compose(diff).ops })
        onImageAddedEvent && onImageAddedEvent(element.description)
      }
    })
  }

  public componentWillUnmount() {
    this.props.bridge.getControlEventDomain().release(this)
  }

  public componentDidUpdate(oldProps: Sheet.Props) {
    invariant(oldProps.bridge === this.props.bridge, 'bridge prop cannot be changed after instantiation')
  }

  public render() {
    const { ops } = this.props.documentContent
    const groups = groupOpsByBlocks(ops)
    return <View style={[styles.root, this.props.contentContainerStyle]}>{groups.map(this.renderBlockController)}</View>
  }
}

/**
 * A component solely responsible for displaying and editing {@link (RichContent:class)}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
type Sheet = ComponentClass<Sheet.Props>
const Sheet = _Sheet as Sheet

export { Sheet }
