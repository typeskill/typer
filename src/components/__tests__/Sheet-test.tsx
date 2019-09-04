/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
// Test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import { Sheet } from '@components/Sheet'
import { Bridge } from '@core/Bridge'
import { buildInitialDocContent } from '@model/documents'

describe('@components/<Sheet>', () => {
  it('should renders without crashing when a bridge instance is provided', () => {
    const bridge = new Bridge()
    expect(() => {
      renderer.create(<Sheet documentContent={buildInitialDocContent()} bridge={bridge} />)
    }).not.toThrow()
  })
  it('should crash when the bridge prop is not an instance of the Bridge class', () => {
    expect(() => {
      renderer.create(<Sheet documentContent={buildInitialDocContent()} bridge={{} as any} />)
    }).toThrow()
  })
})
