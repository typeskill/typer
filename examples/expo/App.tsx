
import React, { Component } from 'react'
import { StyleSheet, View, KeyboardAvoidingView } from 'react-native'
import Toolbar from './src/Toolbar'
import { Bridge, Sheet } from 'react-native-typeskill'

interface Props {}

// @see: https://github.com/facebook/react-native/issues/9599
if (typeof (global as any).self === 'undefined') {
  (global as any).self = global
}

export default class App extends Component<Props> {
  private bridge: Bridge
  constructor(props: Props) {
    super(props)
    this.bridge = new Bridge()
  }

  render() {
    const innerInterface = this.bridge.getInnerInterface()
    const outerInterface = this.bridge.getOuterInterface()
    return (
      <View style={styles.container}>
        <Sheet bridgeInnerInterface={innerInterface} />
        <KeyboardAvoidingView>
          <Toolbar bridgeOuterInferface={outerInterface} />
        </KeyboardAvoidingView>}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  }
})
