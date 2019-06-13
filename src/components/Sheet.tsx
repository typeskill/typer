import invariant from 'invariant'
import React, { PureComponent } from 'react'
import { View, StyleSheet, StyleProp, TextStyle, ViewStyle } from 'react-native'
import { TextBlockController } from '@components/TextBlockController'
import { Bridge } from '@core/Bridge'
import { Document } from '@model/Document'
import { TextBlock } from '@model/TextBlock'
import { boundMethod } from 'autobind-decorator'
import { Store, getStoreInitialState } from '@model/Store'

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignSelf: 'stretch',
    padding: 10
  }
})

declare namespace Sheet {
  export interface Props<T extends string> {
    /**
     * **Warning** This property cannot be changed after instantiation.
     */
    bridgeInnerInterface: Bridge.InnerInterface<T>
    textStyle?: StyleProp<TextStyle>
    contentContainerStyle?: StyleProp<ViewStyle>
  }
}

class Sheet<T extends string> extends PureComponent<Sheet.Props<T>, Store.State> {

  private document: Document<T>
  private docConsumer: Document.Consumer<T>

  state: Store.State = getStoreInitialState()

  constructor(props: Sheet.Props<T>) {
    super(props)
    const { bridgeInnerInterface } = this.props
    invariant(bridgeInnerInterface != null, 'bridgeInnerInterface prop is required')
    this.document = new Document()
    this.docConsumer = Object.freeze({
      bridgeInnerInterface,
      handleOnDocumentStateUpdate: (state: Store.State) => {
        this.setState(state, () => this.forceUpdate())
      }
    })
  }

  @boundMethod
  private renderTextBlockController(blockInstanceNumber: number, index: number) {
    const block: TextBlock<any> = this.document.getBlock(blockInstanceNumber) as TextBlock<any>
    const key = `block-controller-${blockInstanceNumber}`
    return (
      <TextBlockController<T> key={key} textBlock={block} grow={true} />
    )
  }

  componentDidMount() {
    this.document.registerConsumer(this.docConsumer)
  }

  componentWillUnmount() {
    this.document.releaseConsumer(this.docConsumer)
  }

  componentDidUpdate(oldProps: Sheet.Props<T>, oldState: Store.State) {
    invariant(oldProps.bridgeInnerInterface === this.props.bridgeInnerInterface, 'bridgeInnerInterface prop cannot be changed after instantiation')
    if (this.state.selectedBlockInstanceNumber !== oldState.selectedBlockInstanceNumber && this.state.selectedBlockInstanceNumber !== null) {
      this.document.emitToBlock('FOCUS_REQUEST', this.state.selectedBlockInstanceNumber)
    }
  }

  render() {
    return (
      <View style={[styles.root, this.props.contentContainerStyle]}>
        {this.state.blockOrders.map((instanceNumber, index) => this.renderTextBlockController(instanceNumber, index))}
      </View>
    )
  }
}

export { Sheet }
