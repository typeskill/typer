import React from 'react'
// Test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import { buildEmptyDocument } from '@model/document'
import { buildBridge } from '@core/Bridge'
import { Toolbar } from '@components/Toolbar'

describe('@components/<Toolbar>', () => {
  it('should renders without crashing', () => {
    const toolbar = renderer.create(<Toolbar layout={[]} bridge={buildBridge()} document={buildEmptyDocument()} />)
    expect(toolbar).toBeTruthy()
  })
})
