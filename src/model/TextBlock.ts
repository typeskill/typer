import Block from './Block'
import Document from './Document'
import { TextAttributesMap } from '@delta/attributes'
import { boundMethod } from 'autobind-decorator'
import { Selection } from '@delta/selection'
import TextTransformsRegistry from '@core/TextTransformsRegistry'
import { DeltaChangeContext } from '@delta/DocumentDelta'

export default class TextBlock<T extends string> extends Block<T> {

  private cursorTextAttributes: TextAttributesMap<T> = {}
  private selection: Selection = {
    start: 0,
    end: 0
  }
  private length: number = 0

  constructor(blockInterface: Document.BlockInterface<T>) {
    super(blockInterface)
  }

  private updateTextAttributes(selection: Selection): void {
    const textAttributes = this.getDelta().getSelectedTextAttributes(selection)
    this.blockInterface.bridgeInnerInterface.setSelectedTextAttributes(textAttributes)
  }

  getSelection(): Selection {
    return this.selection
  }

  handleOnSelectionChange(selection: Selection): void {
    this.selection = selection
    this.updateTextAttributes(selection)
  }

  getLength(): number {
    return this.length
  }

  setCursorAttributes(cursorAttributes: TextAttributesMap<T>) {
    this.cursorTextAttributes = cursorAttributes
  }

  getCursorAttributes(): TextAttributesMap<T> {
    return this.cursorTextAttributes
  }

  getTextTransformsRegistry(): TextTransformsRegistry<T> {
    return this.blockInterface.bridgeInnerInterface.getTextTransformsReg()
  }

  @boundMethod
  handleOnTextChange(newText: string, context: DeltaChangeContext): void {
    const updatedDelta = this.getDelta().applyTextDiff(newText, context, this.cursorTextAttributes)
    this.updateDelta(updatedDelta)
    this.length = newText.length
    this.updateTextAttributes(context.selectionAfterChange)
  }
}
