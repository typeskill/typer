
import React, { Component } from 'react'
import { StyleSheet, View, KeyboardAvoidingView, SafeAreaView } from 'react-native'
import { Bridge, Sheet, Toolbar, TextControlAction, ToolbarLayout, TEXT_CONTROL_SEPARATOR, buildVectorIconControlSpec } from 'react-native-typeskill'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Version from './src/Version'

// @see: https://github.com/facebook/react-native/issues/9599
if (typeof (global as any).self === 'undefined') {
  (global as any).self = global
}

function buildMaterialControlSpec(actionType: TextControlAction, name: string) {
  return buildVectorIconControlSpec(MaterialCommunityIcons as any, actionType, name)
}

const toolbarLayout: ToolbarLayout = [
  buildMaterialControlSpec(TextControlAction.SELECT_TEXT_BOLD, 'format-bold'),
  buildMaterialControlSpec(TextControlAction.SELECT_TEXT_ITALIC, 'format-italic'),
  buildMaterialControlSpec(TextControlAction.SELECT_TEXT_UNDERLINE, 'format-underline'),
  buildMaterialControlSpec(TextControlAction.SELECT_TEXT_STRIKETHROUGH, 'format-strikethrough-variant'),
  TEXT_CONTROL_SEPARATOR,
  buildMaterialControlSpec(TextControlAction.SELECT_LINES_ORDERED_LIST, 'format-list-numbered'),
  buildMaterialControlSpec(TextControlAction.SELECT_LINES_UNORDERED_LIST, 'format-list-bulleted')
]

const themeColor = '#ffffff'

export default class App extends Component<{}> {
  private bridge: Bridge
  constructor(props: {}) {
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
            <Sheet bridgeInnerInterface={innerInterface} />
            <Version />
            <Toolbar layout={toolbarLayout} contentContainerStyle={{ backgroundColor: '#eaf0fc' }} bridgeOuterInferface={outerInterface} />
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
  }
})
