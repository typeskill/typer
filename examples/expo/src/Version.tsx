import React from 'react'
import { View, Text } from 'react-native'

// tslint:disable-next-line:no-require-imports
const version = (require('../package.json') as any).dependencies['react-native-typeskill'] as string

const Version = () => (
  <View style={{ opacity: .15, marginTop: 4 }}>
    <Text style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: 8, textAlign: 'center' }}>react-native-typeskill@{version} demo</Text>
  </View>
)

export default Version
