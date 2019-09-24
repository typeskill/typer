import React from 'react'
// Test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import { Print } from '@components/Print'
import { buildEmptyDocument } from '@model/document'

fdescribe('@components/<Print>', () => {
  it('should renders without crashing', () => {
    const print = renderer.create(<Print document={buildEmptyDocument()} />)
    expect(print).toBeTruthy()
  })
})
