
import React, { Component } from 'react'
import { StyleSheet, View, KeyboardAvoidingView, SafeAreaView, Text } from 'react-native'
import Toolbar from './src/Toolbar'
import { Bridge, Sheet } from 'react-native-typeskill'
import { Constants } from 'expo'

// tslint:disable-next-line:no-require-imports
const version = (require('./package.json') as any).dependencies['react-native-typeskill'] as string

interface Props {}

// @see: https://github.com/facebook/react-native/issues/9599
if (typeof (global as any).self === 'undefined') {
  (global as any).self = global
}

const themeColor = '#ffffff'

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
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container} >
          <KeyboardAvoidingView style={{ flex: 1 }} enabled>
            <View>
              <Text style={{ fontFamily: 'monospace', fontSize: 8, textAlign: 'center' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 12 }}>react-native-typeskill@{version}</Text> {'\n'}
                ⚠️ This library is in early development and subject to fast changes.
              </Text>
            </View>
            <Sheet bridgeInnerInterface={innerInterface} />
            <Toolbar contentContainerStyle={{ backgroundColor: '#eaf0fc', elevation: 100 }} bridgeOuterInferface={outerInterface} />
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    backgroundColor: themeColor,
    position: 'relative'
  },
  statusBar: {
    height: Constants.statusBarHeight
  }
})
