import invariant from 'invariant'
import React, { PureComponent, ComponentClass } from 'react'
import { View, StyleSheet, StyleProp, TextStyle, ViewStyle, ViewPropTypes, LayoutChangeEvent } from 'react-native'
import { Bridge } from '@core/Bridge'
import { DocumentContent, applyTextTransformToSelection } from '@model/document'
import { boundMethod } from 'autobind-decorator'
import PropTypes from 'prop-types'
import { DocumentContentPropType } from './types'
import { GenericBlockController } from './GenericBlockController'
import { BlockDescriptor, groupOpsByBlocks, createScopedContentMerger } from '@model/blocks'
import { Selection } from '@delta/Selection'
import { DocumentDelta } from '@delta/DocumentDelta'
import Delta from 'quill-delta/dist/Delta'
import mergeLeft from 'ramda/es/mergeLeft'

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
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
    justifyContent: 'center',
    alignItems: 'stretch',
  },
})

interface SheetState {
  containerWidth: number | null
}

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
     * @remarks This property MUST NOT be changed after instantiation.
     */
    bridge: Bridge
    /**
     * Component styles.
     */
    style?: StyleProp<ViewStyle>
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
     *
     * @remarks This callback is expected to return a promise. This promise MUST resolve when the update had been proceeded.
     */
    onDocumentContentUpdate?: (nextDocumentContent: DocumentContent) => Promise<void>
    /**
     * Style applied to the content container.
     *
     * @remarks This prop MUST NOT contain padding or margin rules. Such spacing rules will be zero-ed.
     * Apply padding to the {@link (Sheet:namespace).Props.style | `style`} prop instead.
     */
    contentContainerStyle?: StyleProp<ViewStyle>
  }
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Sheet extends PureComponent<Sheet.Props, SheetState> {
  public static propTypes: Record<keyof Sheet.Props, any> = {
    bridge: PropTypes.instanceOf(Bridge).isRequired,
    style: ViewPropTypes.style,
    contentContainerStyle: ViewPropTypes.style,
    textStyle: PropTypes.any,
    documentContent: DocumentContentPropType.isRequired,
    onDocumentContentUpdate: PropTypes.func,
  }

  public state: SheetState = {
    containerWidth: null,
  }

  public constructor(props: Sheet.Props) {
    super(props)
    const { bridge } = this.props
    invariant(bridge != null, 'bridge prop is required')
    invariant(bridge instanceof Bridge, 'bridge prop must be an instance of Bridge class')
  }

  private handleOnContainerLayout = (layoutEvent: LayoutChangeEvent) => {
    this.setState({
      containerWidth: layoutEvent.nativeEvent.layout.width,
    })
  }

  private createScopedContentUpdater = (descriptor: BlockDescriptor) => {
    const merger = createScopedContentMerger(descriptor)
    return async (scopedContent: Partial<DocumentContent> | Delta) => {
      this.updateDocumentContent(merger(scopedContent, this.props.documentContent))
    }
  }

  private updateDocumentContent(documentUpdate: Partial<DocumentContent>): Promise<void> {
    return (
      (this.props.onDocumentContentUpdate &&
        this.props.documentContent &&
        this.props.onDocumentContentUpdate(mergeLeft(documentUpdate, this.props.documentContent) as DocumentContent)) ||
      Promise.resolve()
    )
  }

  @boundMethod
  private renderBlockController(descriptor: BlockDescriptor, blockIndex: number, array: BlockDescriptor[]) {
    const { textStyle, bridge } = this.props
    const isFirst = descriptor.blockIndex === 0
    const isLast = descriptor.blockIndex === array.length - 1
    const { textAttributesAtCursor, currentSelection, ops } = this.props.documentContent
    const selectionAfterBlock = {
      start: currentSelection.end + 1,
      end: currentSelection.end + 1,
    }
    const selectionBeforeBlock = {
      start: currentSelection.start - 1,
      end: currentSelection.start - 1,
    }
    const updateScopedContent = this.createScopedContentUpdater(descriptor)
    const moveAfterBlock = () => {
      if (isLast) {
        updateScopedContent({ ops: [...ops, { insert: '\n' }], currentSelection: selectionAfterBlock })
      } else {
        updateScopedContent({ currentSelection: selectionAfterBlock })
      }
    }
    const moveBeforeBlock = () => {
      if (!isFirst) {
        updateScopedContent({ currentSelection: selectionBeforeBlock })
      }
    }
    const insertAfterBlock = (character: string) => {
      if (isLast) {
        updateScopedContent({ ops: [...ops, { insert: `${character}\n` }], currentSelection: selectionAfterBlock })
      } else {
        const nextKind = array[blockIndex].kind
        if (nextKind === 'text') {
          updateScopedContent({ ops: [...ops, { insert: character }], currentSelection: selectionAfterBlock })
        } else {
          updateScopedContent({ ops: [...ops, { insert: `${character}\n` }], currentSelection: selectionAfterBlock })
        }
      }
    }
    const removeCurrentBlock = () => {
      updateScopedContent(
        isFirst
          ? {
              ops: [{ insert: '\n' }],
              currentSelection: { start: 0, end: 0 },
            }
          : { ops: [], currentSelection: { start: -1, end: -1 } },
      )
    }
    const key = `block-${descriptor.kind}-${descriptor.blockIndex}`
    const offset = descriptor.selectableUnitsOffset
    const isFocused =
      currentSelection.start >= offset && currentSelection.start <= offset + descriptor.numOfSelectableUnits
    // console.warn(`${key} ${isFocused}`)
    return (
      <GenericBlockController
        updateScopedContent={updateScopedContent}
        contentWidth={this.state.containerWidth}
        removeCurrentBlock={removeCurrentBlock}
        insertAfterBlock={insertAfterBlock}
        moveAfterBlock={moveAfterBlock}
        moveBeforeBlock={moveBeforeBlock}
        isFocused={isFocused}
        textStyle={textStyle}
        imageLocatorService={bridge.getImageLocator()}
        key={key}
        descriptor={descriptor}
        isFirst={isFirst}
        isLast={isLast}
        textAttributesAtCursor={textAttributesAtCursor}
        textTransforms={this.props.bridge.getTransforms()}
      />
    )
  }

  public componentDidMount() {
    const sheetEventDom = this.props.bridge.getSheetEventDomain()
    sheetEventDom.addApplyTextTransformToSelectionListener(this, async (attributeName, attributeValue) => {
      return this.updateDocumentContent(
        applyTextTransformToSelection(attributeName, attributeValue, this.props.documentContent),
      )
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
          .insert('\n')
          .insert({ kind: 'image' }, element.description)
          .delete(1)
        const nextPosition = diff.transformPosition(currentSelection.start)
        await this.updateDocumentContent({
          ops: delta.compose(diff).ops,
          currentSelection: { start: nextPosition, end: nextPosition },
        })
        onImageAddedEvent && onImageAddedEvent(element.description)
      }
    })
  }

  public componentWillUnmount() {
    this.props.bridge.getSheetEventDomain().release(this)
  }

  public async componentDidUpdate(oldProps: Sheet.Props) {
    invariant(oldProps.bridge === this.props.bridge, 'bridge prop cannot be changed after instantiation')
    const { currentSelection, ops } = this.props.documentContent
    if (oldProps.documentContent.currentSelection !== currentSelection) {
      const delta = new DocumentDelta(ops)
      const nextAttributes = delta.getSelectedTextAttributes(Selection.fromShape(currentSelection))
      await this.updateDocumentContent({
        selectedTextAttributes: nextAttributes,
        textAttributesAtCursor: nextAttributes,
      })
    }
  }

  public render() {
    const { ops } = this.props.documentContent
    const groups = groupOpsByBlocks(ops)
    return (
      <View style={[styles.root, this.props.style]}>
        <View
          style={[styles.contentContainer, this.props.contentContainerStyle, styles.overridingContentStyles]}
          onLayout={this.handleOnContainerLayout}
        >
          {groups.map(this.renderBlockController)}
        </View>
      </View>
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
type Sheet = ComponentClass<Sheet.Props>
const Sheet = _Sheet as Sheet

export { Sheet }
