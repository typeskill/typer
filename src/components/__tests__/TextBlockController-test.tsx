// tslint:disable:no-string-literal
import { TextInput } from 'react-native'
import React from 'react'
// Test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import { BaseTextTransformAttribute } from '@core/transforms'
import { Document } from '@model/Document'
import { Bridge } from '@core/Bridge'
import { TextBlock } from '@model/TextBlock'
import { RichText } from '@components/RichText'
import {
  TextBlockController,
  INVARIANT_MANDATORY_TEXT_BLOCK_PROP,
  TextBlockControllerProps,
} from '@components/TextBlockController'
import { mockSelectionChangeEvent, flattenTextChild } from '@test/vdom'

function buildDocumentConsumer() {
  const bridge = new Bridge()
  const document = new Document<BaseTextTransformAttribute>()
  const handleOnDocumentStateUpdate = () => ({
    /** */
  })
  const getDelta = () => document.getActiveBlock().getDelta()
  const docConsumer: Document.Consumer<any> = {
    handleOnDocumentStateUpdate,
    bridgeInnerInterface: bridge.getInnerInterface(),
  }
  return {
    bridge,
    document,
    docConsumer,
    handleOnDocumentStateUpdate,
    getDelta,
  }
}

function getTextInputDefaultProps(): TextBlockControllerProps<BaseTextTransformAttribute> {
  const bridge = new Bridge()
  const document = new Document<BaseTextTransformAttribute>()
  document.registerConsumer({
    handleOnDocumentStateUpdate: () => ({}),
    bridgeInnerInterface: bridge.getInnerInterface(),
  })
  return {
    textBlock: document.getActiveBlock() as TextBlock<any>,
  }
}

// Running jest.runAllTimers synchronously causes a bug
// were react component are not always rerendered
// after those timers end.
// See: https://git.io/fjzbL
async function runAllTimers() {
  return Promise.resolve().then(() => jest.runAllTimers())
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
})

describe('@components/<TextBlockController>', () => {
  it('should throw when document has not registered a consumer yet', () => {
    expect(() => {
      renderer.create(<TextBlockController textBlock={undefined as any} />)
    }).toThrowError(INVARIANT_MANDATORY_TEXT_BLOCK_PROP)
  })
  it('renders without crashing', () => {
    const textInput = renderer.create(<TextBlockController {...getTextInputDefaultProps()} />)
    expect(textInput).toBeTruthy()
  })
  it('has a <TextInput> child', () => {
    const wrapper = renderer.create(<TextBlockController {...getTextInputDefaultProps()} />)
    expect(wrapper.root.findByType(TextInput)).toBeTruthy()
  })
  it('should update selection appropriately', async () => {
    const { document, bridge, docConsumer } = buildDocumentConsumer()
    document.registerConsumer(docConsumer)
    const block = document.getActiveBlock() as TextBlock<any>
    const listenerObj = {
      listener: () => ({}),
    }
    const spy = jest.spyOn(listenerObj, 'listener')
    bridge.getOuterInterface().addSelectedAttributesChangeListener(listenerObj, spy as any)
    const wrapper = renderer.create(<TextBlockController textBlock={block} />)
    const textBlockController = wrapper.root.instance as TextBlockController<any>
    textBlockController['handleOnSelectionChangeEvent'](mockSelectionChangeEvent(0, 1))
    await runAllTimers()
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('should comply with DocumentDelta when text updates', async () => {
    const { document, docConsumer, getDelta } = buildDocumentConsumer()
    document.registerConsumer(docConsumer)
    const block = document.getActiveBlock() as TextBlock<any>
    const wrapper = renderer.create(<TextBlockController textBlock={block} />)
    const textBlockController = (wrapper.getInstance() as unknown) as TextBlockController<any>
    expect(textBlockController).toBeInstanceOf(TextBlockController)
    textBlockController['handleOnTextChanged']('This is nu text')
    textBlockController['handleOnSelectionChangeEvent'](mockSelectionChangeEvent(15, 15))
    await runAllTimers()
    expect(getDelta().ops).toEqual([{ insert: 'This is nu text\n' }])
  })
  it('should stay in sync with textBlock', async () => {
    const { document, docConsumer } = buildDocumentConsumer()
    document.registerConsumer(docConsumer)
    const block = document.getActiveBlock() as TextBlock<any>
    const wrapper = renderer.create(<TextBlockController textBlock={block} />)
    const textBlockController = (wrapper.getInstance() as unknown) as TextBlockController<any>
    expect(textBlockController).toBeInstanceOf(TextBlockController)
    textBlockController['handleOnTextChanged']('This is nu text\nBlah')
    textBlockController['handleOnSelectionChangeEvent'](mockSelectionChangeEvent(20, 20))
    wrapper.update(<TextBlockController textBlock={block} />)
    await runAllTimers()
    wrapper.update(<TextBlockController textBlock={block} />)
    const richText = wrapper.root.findByType(RichText)
    const text = flattenTextChild(richText)
    expect(text.join('')).toEqual('This is nu text\nBlah')
  })
})
