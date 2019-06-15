import React, { Component } from 'react'
import { Card } from 'react-native-paper'
import { StyleSheet, View, KeyboardAvoidingView, SafeAreaView } from 'react-native'
import {
  Bridge,
  Sheet,
  Toolbar,
  TextControlAction,
  ToolbarLayout,
  TEXT_CONTROL_SEPARATOR,
  buildVectorIconControlSpec,
} from 'react-native-typeskill'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Version from './src/Version'

// @see: https://github.com/facebook/react-native/issues/9599
if (typeof (global as any).self === 'undefined') {
  ;(global as any).self = global
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
  buildMaterialControlSpec(TextControlAction.SELECT_LINES_UNORDERED_LIST, 'format-list-bulleted'),
]

const themeColor = '#ffffff'
const iconSize = 25

export default class App extends Component<{}> {
  private bridge: Bridge
  constructor(props: {}) {
    super(props)
    this.bridge = new Bridge()
  }

  render() {
    const sheetEventDom = this.bridge.getSheetEventDomain()
    const controlEventDom = this.bridge.getControlEventDomain()
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <KeyboardAvoidingView style={{ flex: 1 }} enabled>
            <Version />
            <Card style={{ flex: 1, marginHorizontal: 10, marginTop: 4 }}>
              <Sheet contentContainerStyle={{ marginBottom: iconSize + 4 }} sheetEventDom={sheetEventDom} />
            </Card>
            <View style={styles.toolbarContainer}>
              <Toolbar
                iconSize={iconSize}
                layout={toolbarLayout}
                contentContainerStyle={{ backgroundColor: '#eaf0fc' }}
                bridgeOuterInferface={controlEventDom}
              />
            </View>
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
    position: 'relative',
  },
  toolbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 1000,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
