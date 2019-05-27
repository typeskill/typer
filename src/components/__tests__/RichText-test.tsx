import React from 'react'
// Test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import RichText from '@components/RichText'
import DocumentDelta from '@delta/DocumentDelta'
import TextTransformsRegistry from '@core/TextTransformsRegistry'
import { defaultTextTransforms } from '@delta/transforms'
import { flattenTextChild } from '@test/vdom'

describe('@components/<RichText>', () => {
  it('should renders without crashing', () => {
    const delta = new DocumentDelta()
    const registry = new TextTransformsRegistry(defaultTextTransforms)
    const richText = renderer.create(<RichText documentDelta={delta} textTransformsReg={registry}/>)
    expect(richText).toBeTruthy()
  })
  it('should comply with document documentDelta by removing last newline character', () => {
    const delta = new DocumentDelta([
      { insert: 'eheh' },
      { insert: '\n', attributes: { $type: 'normal' } },
      { insert: 'ahah' },
      { insert: '\n', attributes: { $type: 'normal' } },
      { insert: 'ohoh\n' }
    ])
    const registry = new TextTransformsRegistry(defaultTextTransforms)
    const richText = renderer.create(<RichText documentDelta={delta} textTransformsReg={registry}/>)
    const textContent = flattenTextChild(richText.root)
    expect(textContent.join('')).toEqual([
      'eheh',
      '\n',
      'ahah',
      '\n',
      'ohoh'
    ].join(''))
  })
})
