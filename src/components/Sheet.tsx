import invariant from 'invariant'
import React, { PureComponent, ComponentClass } from 'react'
import { View, StyleSheet, StyleProp, TextStyle, ViewStyle, ViewPropTypes } from 'react-native'
import { TextBlockController } from '@components/TextBlockController'
import { Bridge } from '@core/Bridge'
import { Document } from '@model/Document'
import { TextBlock } from '@model/TextBlock'
import { boundMethod } from 'autobind-decorator'
import { Store, getStoreInitialState } from '@model/Store'
import { RichContent } from '@model/RichContent'
import PropTypes from 'prop-types'
import { RichContentPropType } from './types'

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
     * The rich content to display.
     */
    richContent: RichContent
    /**
     * Handler to receive {@link (RichContent:class)} updates.
     */
    onRichContentUpdate?: (richText: RichContent) => void
    /**
     * Style applied to the container.
     */
    contentContainerStyle?: StyleProp<ViewStyle>
  }
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Sheet extends PureComponent<Sheet.Props, Store.State> {
  private document: Document
  private docConsumer: Document.Consumer

  public state: Store.State = getStoreInitialState()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static propTypes: Record<keyof Sheet.Props, any> = {
    bridge: PropTypes.instanceOf(Bridge).isRequired,
    contentContainerStyle: ViewPropTypes.style,
    textStyle: PropTypes.any,
    richContent: RichContentPropType,
    onRichContentUpdate: PropTypes.func,
  }

  public constructor(props: Sheet.Props) {
    super(props)
    const { bridge } = this.props
    invariant(bridge != null, 'bridge prop is required')
    invariant(bridge instanceof Bridge, 'bridge prop must be an instance of Bridge class')
    const sheetEventDom = bridge.getSheetEventDomain()
    this.document = new Document()
    this.docConsumer = Object.freeze({
      sheetEventDom,
      handleOnDocumentStateUpdate: (state: Store.State) => {
        this.setState(state, () => this.forceUpdate())
      },
    })
  }

  @boundMethod
  private renderTextBlockController(blockInstanceNumber: number) {
    const block: TextBlock = this.document.getBlock(blockInstanceNumber) as TextBlock
    const key = `block-controller-${blockInstanceNumber}`
    return <TextBlockController key={key} textBlock={block} grow={true} />
  }

  public componentDidMount() {
    this.document.registerConsumer(this.docConsumer)
  }

  public componentWillUnmount() {
    this.document.releaseConsumer(this.docConsumer)
  }

  public componentDidUpdate(oldProps: Sheet.Props, oldState: Store.State) {
    invariant(oldProps.bridge === this.props.bridge, 'bridge prop cannot be changed after instantiation')
    if (
      this.state.selectedBlockInstanceNumber !== oldState.selectedBlockInstanceNumber &&
      this.state.selectedBlockInstanceNumber !== null
    ) {
      this.document.emitToBlock('FOCUS_REQUEST', this.state.selectedBlockInstanceNumber)
    }
  }

  public render() {
    return (
      <View style={[styles.root, this.props.contentContainerStyle]}>
        {this.state.blockOrders.map(instanceNumber => this.renderTextBlockController(instanceNumber))}
      </View>
    )
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
