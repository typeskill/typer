import { Document } from './Document'
import { Block } from './Block'
import { Attributes } from '@delta/attributes'
import { boundMethod } from 'autobind-decorator'
import { Selection } from '@delta/Selection'
import { Transforms } from '@core/Transforms'
import { DeltaChangeContext } from '@delta/DeltaChangeContext'
import mergeLeft from 'ramda/es/mergeLeft'

export class TextBlock extends Block {
  private cursorTextAttributes: Attributes.Map = {}
  private length: number = 0

  public constructor(blockInterface: Document.BlockInterface) {
    super(blockInterface)
  }

  private updateLineType(selection: Selection): void {
    const lineType = this.getDelta().getLineTypeInSelection(selection)
    this.blockInterface.sheetEventDom.notifySelectedLineTypeChange(lineType)
  }

  private updateTextAttributes(selection: Selection): void {
    const textAttributes = this.getDelta().getSelectedTextAttributes(selection)
    this.blockInterface.sheetEventDom.notifySelectedTextAttributesChange(textAttributes)
  }

  public handleOnSelectionChange(selection: Selection): void {
    this.selection = selection
    this.updateTextAttributes(selection)
    this.updateLineType(selection)
  }

  public getLength(): number {
    return this.length
  }

  public setCursorAttributes(cursorTextAttributes: Attributes.Map): Attributes.Map {
    this.cursorTextAttributes = mergeLeft(cursorTextAttributes, this.cursorTextAttributes)
    return this.cursorTextAttributes
  }

  public getCursorAttributes(): Attributes.Map {
    return this.cursorTextAttributes
  }

  public getTextTransformsRegistry(): Transforms {
    return this.blockInterface.sheetEventDom.getTransforms()
  }

  @boundMethod
  public handleOnTextChange(newText: string, deltaChangeContext: DeltaChangeContext): void {
    const documentDeltaUpdate = this.getDelta().applyTextDiff(newText, deltaChangeContext, this.cursorTextAttributes)
    this.updateDelta(documentDeltaUpdate)
    this.length = newText.length
    this.updateTextAttributes(deltaChangeContext.selectionAfterChange)
    const lineType = documentDeltaUpdate.getLineTypeInSelection(deltaChangeContext.selectionAfterChange)
    this.blockInterface.sheetEventDom.notifySelectedLineTypeChange(lineType)
  }
}
