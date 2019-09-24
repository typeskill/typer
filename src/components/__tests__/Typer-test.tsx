import React from 'react'
// Test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import { buildEmptyDocument } from '@model/document'
import { Typer } from '@components/Typer'
import { buildBridge } from '@core/Bridge'

describe('@components/<Typer>', () => {
  it('should renders without crashing', () => {
    const typer = renderer.create(<Typer bridge={buildBridge()} document={buildEmptyDocument()} />)
    expect(typer).toBeTruthy()
  })
})
