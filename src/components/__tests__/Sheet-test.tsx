// tslint:disable:no-string-literal
import { TextInput } from 'react-native'
import React from 'react'
// Test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import Sheet from '@components/Sheet'
import Bridge from '@core/Bridge'

describe('@components/<Sheet>', () => {
  it('should renders without crashing', () => {
    const bridge = new Bridge()
    const sheet = renderer.create(<Sheet bridgeInnerInterface={bridge.getInnerInterface()} />)
    expect(sheet).toBeTruthy()
  })
})
