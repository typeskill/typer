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
    padding: 10,
  },
})

declare namespace Sheet {
  export interface Props {
    /**
     * **Warning** This property cannot be changed after instantiation.
     */
    bridgeInnerInterface: Bridge.InnerInterface
    textStyle?: StyleProp<TextStyle>
    contentContainerStyle?: StyleProp<ViewStyle>
  }
}

class Sheet extends PureComponent<Sheet.Props, Store.State> {
  private document: Document
  private docConsumer: Document.Consumer

  public state: Store.State = getStoreInitialState()

  public constructor(props: Sheet.Props) {
    super(props)
    const { bridgeInnerInterface } = this.props
    invariant(bridgeInnerInterface != null, 'bridgeInnerInterface prop is required')
    this.document = new Document()
    this.docConsumer = Object.freeze({
      bridgeInnerInterface,
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
    invariant(
      oldProps.bridgeInnerInterface === this.props.bridgeInnerInterface,
      'bridgeInnerInterface prop cannot be changed after instantiation',
    )
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

export { Sheet }
