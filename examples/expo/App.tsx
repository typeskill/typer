import React, { Component, ComponentClass } from 'react'
import { Card } from 'react-native-paper'
import { StyleSheet, View, KeyboardAvoidingView, SafeAreaView } from 'react-native'
import { Bridge, Sheet, Toolbar, ControlAction, buildVectorIconControlSpec } from 'react-native-typeskill'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import Version from './src/Version'

// @see: https://github.com/facebook/react-native/issues/9599
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (global as any).self === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(global as any).self = global
}

function buildMaterialControlSpec(actionType: ControlAction, name: string) {
  return buildVectorIconControlSpec(
    (MaterialCommunityIcons as unknown) as ComponentClass<Toolbar.VectorIconMinimalProps>,
    actionType,
    name,
  )
}

const toolbarLayout: Toolbar.Layout = [
  buildMaterialControlSpec(ControlAction.SELECT_TEXT_BOLD, 'format-bold'),
  buildMaterialControlSpec(ControlAction.SELECT_TEXT_ITALIC, 'format-italic'),
  buildMaterialControlSpec(ControlAction.SELECT_TEXT_UNDERLINE, 'format-underline'),
  buildMaterialControlSpec(ControlAction.SELECT_TEXT_STRIKETHROUGH, 'format-strikethrough-variant'),
]

const themeColor = '#ffffff'
const iconSize = 25

export default class App extends Component {
  private bridge: Bridge
  public constructor(props: {}) {
    super(props)
    this.bridge = new Bridge()
  }

  public render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <KeyboardAvoidingView style={{ flex: 1 }} enabled>
            <Version />
            <Card style={{ flex: 1, marginHorizontal: 10, marginTop: 4 }}>
              <Sheet contentContainerStyle={{ marginBottom: iconSize + 4 }} bridge={this.bridge} />
            </Card>
            <View style={styles.toolbarContainer}>
              <Toolbar
                iconSize={iconSize}
                layout={toolbarLayout}
                contentContainerStyle={{ backgroundColor: '#eaf0fc' }}
                bridge={this.bridge}
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
