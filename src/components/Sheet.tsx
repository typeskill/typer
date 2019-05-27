import invariant from 'invariant'
import React, { PureComponent } from 'react'
import { View, StyleSheet, StyleProp, TextStyle } from 'react-native'
import TextBlockController from '@components/TextBlockController'
import Bridge from '@core/Bridge'
import Document from '@model/Document'
import TextBlock from '@model/TextBlock'
import { boundMethod } from 'autobind-decorator'
import Store, { getStoreInitialState } from '@model/Store'

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgb(251,251,251)',
    alignSelf: 'stretch',
    padding: 10
  }
})

interface SheetProps<T extends string> {
  /**
   * **Warning** This property cannot be changed after instantiation.
   */
  bridgeInnerInterface: Bridge.InnerInterface<T>
  textStyle?: StyleProp<TextStyle>
}

export default class Sheet<T extends string> extends PureComponent<SheetProps<T>, Store.State> {

  private document: Document<T>
  private docConsumer: Document.Consumer<T>

  state: Store.State = getStoreInitialState()

  constructor(props: SheetProps<T>) {
    super(props)
    const { bridgeInnerInterface } = this.props
    invariant(bridgeInnerInterface != null, 'bridgeInnerInterface prop is required')
    this.document = new Document()
    this.docConsumer = Object.freeze({
      bridgeInnerInterface,
      handleOnDocumentStateUpdate: (state: Store.State) => {
        this.setState(state)
      }
    })
  }

  @boundMethod
  private renderTextBlockController(blockInstanceNumber: number, index: number) {
    invariant(this.state.deltas[blockInstanceNumber] != null, `delta must exist for block ${blockInstanceNumber}`)
    const documentDelta = this.state.deltas[blockInstanceNumber]
    const block: TextBlock<any> = this.document.getBlock(blockInstanceNumber) as TextBlock<any>
    const key = `block-controller-${blockInstanceNumber}`
    return (
      <TextBlockController<T> key={key} textBlock={block} documentDelta={documentDelta} grow={true} />
    )
  }

  componentWillMount() {
    this.document.registerConsumer(this.docConsumer)
  }

  componentWillUnmount() {
    this.document.releaseConsumer(this.docConsumer)
  }

  componentWillReceiveProps(nextProps: SheetProps<T>) {
    invariant(nextProps.bridgeInnerInterface === this.props.bridgeInnerInterface, 'bridgeInnerInterface prop cannot be changed after instantiation')
  }

  componentDidUpdate(_oldProps: SheetProps<T>, oldState: Store.State) {
    if (this.state.selectedBlockInstanceNumber !== oldState.selectedBlockInstanceNumber && this.state.selectedBlockInstanceNumber !== null) {
      this.document.emitToBlock('FOCUS_REQUEST', this.state.selectedBlockInstanceNumber)
    }
  }

  render() {
    return (
      <View style={styles.root}>
        {this.state.blockOrders.map((instanceNumber, index) => this.renderTextBlockController(instanceNumber, index))}
      </View>
    )
  }
}
