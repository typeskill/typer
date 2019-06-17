import { Document } from './Document'
import { Block } from './Block'
import { Attributes } from '@delta/attributes'
import { boundMethod } from 'autobind-decorator'
import { Selection } from '@delta/Selection'
import { Transforms } from '@core/Transforms'
import { DeltaChangeContext } from '@delta/DeltaChangeContext'
import mergeLeft from 'ramda/es/mergeLeft'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'

export class TextBlock extends Block {
  private cursorTextAttributes: Attributes.Map = {}
  private length: number = 0

  public constructor(blockInterface: Document.BlockInterface) {
    super(blockInterface)
  }

  private updateLineType(selection: Selection): void {
    const lineType = this.delta.getLineTypeInSelection(selection)
    this.blockInterface.sheetEventDom.notifySelectedLineTypeChange(lineType)
  }

  private updateTextAttributes(selection: Selection): void {
    const textAttributes = this.delta.getSelectedTextAttributes(selection)
    this.blockInterface.sheetEventDom.notifySelectedTextAttributesChange(textAttributes)
  }

  protected afterAtomicUpdate(update: DocumentDeltaAtomicUpdate) {
    this.length = update.delta.length()
    this.handleOnSelectionChange(update.selectionAfterChange)
  }

  public handleOnSelectionChange(selection: Selection): void {
    this.setSelection(selection)
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
  public createSerialUpdateGenerator(
    newText: string,
    deltaChangeContext: DeltaChangeContext,
  ): IterableIterator<DocumentDeltaAtomicUpdate> {
    const documentDeltaUpdate = this.delta.applyTextDiff(newText, deltaChangeContext, this.cursorTextAttributes)
    return this.transformSerialUpdateToGenerator(documentDeltaUpdate)
  }
}
