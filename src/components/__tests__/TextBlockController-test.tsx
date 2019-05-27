// tslint:disable:no-string-literal
import { TextInput } from 'react-native'
import React from 'react'
// Test renderer must be required after react-native.
import renderer from 'react-test-renderer'
import DocumentDelta from '@delta/DocumentDelta'
import TextBlockController, { TextBlockControllerProps, normalizeText } from '@components/TextBlockController'
import { BaseTextTransformAttribute, TextLineType } from '@delta/transforms'
import Document from '@model/Document'
import Bridge from '@core/Bridge'
import TextBlock from '@model/TextBlock'
import { flattenTextChild } from './utils'
import RichText, { getHeadingCharactersFromType } from '@components/RichText'

function buildDocumentConsumer() {
  const bridge = new Bridge()
  const document = new Document<BaseTextTransformAttribute>()
  const handleOnDocumentStateUpdate = () => ({ /** */ })
  const getDelta = () => document.getActiveBlock()['getDelta']()
  const docConsumer: Document.Consumer<any> = {
    handleOnDocumentStateUpdate,
    bridgeInnerInterface: bridge.getInnerInterface()
  }
  return {
    bridge,
    document,
    docConsumer,
    handleOnDocumentStateUpdate,
    getDelta
  }
}

function getTextInputDefaultProps(): TextBlockControllerProps<BaseTextTransformAttribute> {
  const delta = new DocumentDelta()
  const bridge = new Bridge()
  const document = new Document<BaseTextTransformAttribute>()
  document.registerConsumer({
    handleOnDocumentStateUpdate: () => ({}),
    bridgeInnerInterface: bridge.getInnerInterface()
  })
  return {
    documentDelta: delta,
    textBlock: document.getActiveBlock() as TextBlock<any>
  }
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('@components/<TextBlockController>', () => {
  it('should throw when document has not registered a consumer yet', () => {
    expect(() => {
      const delta = new DocumentDelta()
      renderer.create(<TextBlockController documentDelta={delta} textBlock={undefined as any} />)
    }).toThrowError('model prop must be given at construction')
  })
  it('renders without crashing', () => {
    const textInput = renderer.create(<TextBlockController {...getTextInputDefaultProps()} />)
    expect(textInput).toBeTruthy()
  })
  it('has a <TextInput> child', () => {
    const wrapper = renderer.create(<TextBlockController {...getTextInputDefaultProps()} />)
    expect(wrapper.root.findByType(TextInput)).toBeTruthy()
  })
  it('should update selection appropriately', () => {
    const { document, bridge, docConsumer, getDelta } = buildDocumentConsumer()
    document.registerConsumer(docConsumer)
    const block = document.getActiveBlock() as TextBlock<any>
    const listenerObj = {
      listener: () => ({})
    }
    const spy = jest.spyOn(listenerObj, 'listener')
    bridge.getOuterInterface().addSelectedAttributesChangeListener(listenerObj, spy as any)
    const selection = {
      start: 0,
      end: 1
    }
    const wrapper = renderer.create(<TextBlockController textBlock={block} documentDelta={getDelta()} />)
    const textBlockController = wrapper.root.instance as TextBlockController<any>
    textBlockController['handleOnSelectionChange']({ nativeEvent: { selection } } as any)
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('should receive SELECTION_RANGE_ATTRIBUTES_UPDATE event when attributes get updates', () => {
    const { document, bridge, docConsumer, getDelta } = buildDocumentConsumer()
    document.registerConsumer(docConsumer)
    const block = document.getActiveBlock() as TextBlock<any>
    // @ts-ignore
    const spy = spyOn(TextBlockController.prototype, 'handleOnSelectionRangeAttributesUpdate')
    const wrapper = renderer.create(<TextBlockController textBlock={block} documentDelta={getDelta()} />)
    const textBlockController = wrapper.getInstance() as unknown as TextBlockController<any>
    const selection = {
      start: 0,
      end: 1
    }
    textBlockController['handleOnSelectionChange']({ nativeEvent: { selection } } as any)
    bridge.getOuterInterface().applyTextTransformToSelection('bold', true)
    expect(spy).toHaveBeenCalledTimes(1)
  })
  it('should comply with DocumentDelta when text updates', () => {
    const { document, bridge, docConsumer, getDelta } = buildDocumentConsumer()
    document.registerConsumer(docConsumer)
    const block = document.getActiveBlock() as TextBlock<any>
    const wrapper = renderer.create(<TextBlockController textBlock={block} documentDelta={getDelta()} />)
    const textBlockController = wrapper.getInstance() as unknown as TextBlockController<any>
    expect(textBlockController).toBeInstanceOf(TextBlockController)
    textBlockController['handleOnTextChanged']('This is nu text')
    expect(getDelta().ops).toEqual([
      { insert: 'This is nu text\n' }
    ])
  })
  it('should stay in sync with model', () => {
    const { document, docConsumer, getDelta } = buildDocumentConsumer()
    document.registerConsumer(docConsumer)
    const block = document.getActiveBlock() as TextBlock<any>
    const wrapper = renderer.create(<TextBlockController textBlock={block} documentDelta={getDelta()} />)
    const textBlockController = wrapper.getInstance() as unknown as TextBlockController<any>
    expect(textBlockController).toBeInstanceOf(TextBlockController)
    textBlockController['handleOnTextChanged']('This is nu text\n')
    textBlockController['handleOnTextChanged']('This is nu text\n\n')
    wrapper.update(<TextBlockController textBlock={block} documentDelta={getDelta()} />)
    const richText = wrapper.root.findByType(RichText)
    const text = flattenTextChild(richText)
    expect(text.join('')).toEqual('This is nu text\n')
  })
})

describe('normalizeText', () => {
  it('should preserve text which lines in DocumentDelta are of type "normal"', () => {
    const text = 'eheh\nahah\nohoh\n'
    const delta = new DocumentDelta([
      { insert: 'eheh' },
      { insert: '\n', attributes: { $type: 'normal' } },
      { insert: 'ahah' },
      { insert: '\n', attributes: { $type: 'normal' } },
      { insert: 'ohoh\n' }
    ])
    const result = normalizeText(text, delta)
    expect(result).toEqual(text)
  })
  it('should trim prefixes of lines of "ol" type', () => {
    const deltaText = 'eheh\nahah\nohoh\n'
    const type: TextLineType = 'ol'
    const textInputText = `eheh\n${getHeadingCharactersFromType(type, 0)}ahah\n${getHeadingCharactersFromType(type, 1)}ohoh\n`
    const delta = new DocumentDelta([
      { insert: 'eheh\n' },
      { insert: 'ahah' },
      { insert: '\n', attributes: { $type: type } },
      { insert: 'ohoh' },
      { insert: '\n', attributes: { $type: type } }
    ])
    expect(delta['getText']()).toEqual(deltaText)
    const result = normalizeText(textInputText, delta)
    expect(result).toEqual(deltaText)
  })
  it('should trim prefixes of lines of "quoted" type', () => {
    const deltaText = 'eheh\nahah\n\ohoh\n'
    const type: TextLineType = 'quoted'
    const textInputText = `eheh\n${getHeadingCharactersFromType(type, 0)}ahah\n${getHeadingCharactersFromType(type, 1)}ohoh\n`
    const delta = new DocumentDelta([
      { insert: 'eheh\n' },
      { insert: 'ahah' },
      { insert: '\n', attributes: { $type: type } },
      { insert: 'ohoh' },
      { insert: '\n', attributes: { $type: type } }
    ])
    expect(delta['getText']()).toEqual(deltaText)
    expect(normalizeText(textInputText, delta)).toEqual(deltaText)
  })
  it('should trim prefixes of lines of "ul" type', () => {
    const deltaText = 'eheh\nahah\n\ohoh\n'
    const type: TextLineType = 'ul'
    const textInputText = `eheh\n${getHeadingCharactersFromType(type, 0)}ahah\n${getHeadingCharactersFromType(type, 1)}ohoh\n`
    const delta = new DocumentDelta([
      { insert: 'eheh\n' },
      { insert: 'ahah' },
      { insert: '\n', attributes: { $type: type } },
      { insert: 'ohoh' },
      { insert: '\n', attributes: { $type: type } }
    ])
    expect(delta['getText']()).toEqual(deltaText)
    expect(normalizeText(textInputText, delta)).toEqual(deltaText)
  })
  it('should handle lines length differences', () => {
    const deltaText = 'eheh\nahah\n\ohoh\n'
    const type: TextLineType = 'ul'
    const textInputText = `eheh\n${getHeadingCharactersFromType(type, 0)}ahah\n${getHeadingCharactersFromType(type, 1)}ohoh\n`
    const delta = new DocumentDelta([
      { insert: 'eheh\n' },
      { insert: 'ahah' },
      { insert: '\n', attributes: { $type: type } },
      { insert: 'ohoh' },
      { insert: '\n', attributes: { $type: type } }
    ])
    expect(normalizeText(textInputText, delta)).toEqual(deltaText)
  })
})
