import { BlockDescriptor } from './blocks'
import { Document, applyTextTransformToSelection, buildInitialDocContent } from './document'
import { SelectionShape, Selection } from '@delta/Selection'
import Delta from 'quill-delta'
import { ImageKind, GenericOp } from '@delta/operations'
import { DocumentDelta } from '@delta/DocumentDelta'
import { Attributes } from '@delta/attributes'
import { Bridge } from '@core/Bridge'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'

function elementToInsertion(
  element: Bridge.Element<any>,
  document: Document,
): [ImageKind<any> | string, Attributes.Map?] {
  if (element.type === 'text') {
    return [element.content, document.selectedTextAttributes]
  }
  const imageOpIns: ImageKind<any> = { kind: 'image', ...element.description }
  return [imageOpIns]
}

function getSelectionAfterTransform(diff: Delta, document: Document): SelectionShape {
  const nextPosition = diff.transformPosition(document.currentSelection.start)
  return {
    start: nextPosition,
    end: nextPosition,
  }
}

// TODO handle cursor move attributes

export class Block {
  public readonly descriptor: BlockDescriptor
  private blocks: Block[]

  public get kind() {
    return this.descriptor.kind
  }

  public constructor(descriptor: BlockDescriptor, blocks: Block[]) {
    this.descriptor = descriptor
    this.blocks = blocks
  }

  public isFirst(): boolean {
    return this.descriptor.blockIndex === 0
  }

  public isLast(): boolean {
    return this.descriptor.blockIndex === this.descriptor.maxBlockIndex
  }

  private applyCursorTranslationToDocument(position: number, document: Document): Document {
    const nextSelection: SelectionShape = {
      start: position,
      end: position,
    }
    return {
      ...document,
      currentSelection: nextSelection,
    }
  }

  private applyDiffToDocument(documentDiff: Delta, document: Document): Document {
    const current = new Delta(document.ops)
    const nextDelta = current.compose(documentDiff)
    const nextOps = nextDelta.ops
    const nextSelection = getSelectionAfterTransform(documentDiff, document)
    return {
      ...document,
      currentSelection: nextSelection,
      ops: nextOps,
    }
  }

  /**
   * Mutate block-scoped ops in the document.
   *
   * @param blockScopedDiff - The diff delta to apply to current block.
   * @param document - The document.
   *
   * @returns The resulting document ops.
   */
  private applyBlockScopedDiff(blockScopedDiff: Delta, document: Document): Document {
    let fullDiff = new Delta().retain(this.descriptor.selectableUnitsOffset).concat(blockScopedDiff)
    return this.applyDiffToDocument(fullDiff, document)
  }

  private getPreviousBlock(): Block | null {
    if (this.isFirst()) {
      return null
    }
    return this.blocks[this.descriptor.blockIndex - 1]
  }

  private getNextBlock(): Block | null {
    if (this.isLast()) {
      return null
    }
    return this.blocks[this.descriptor.blockIndex + 1]
  }

  public getDocumentSelection(blockScopedSelection: SelectionShape): SelectionShape {
    return {
      start: blockScopedSelection.start + this.descriptor.selectableUnitsOffset,
      end: blockScopedSelection.end + this.descriptor.selectableUnitsOffset,
    }
  }

  public getBlockScopedSelection(document: Document): SelectionShape {
    return {
      start: document.currentSelection.start - this.descriptor.selectableUnitsOffset,
      end: document.currentSelection.end - this.descriptor.selectableUnitsOffset,
    }
  }

  public getSelectedOps(document: Document): GenericOp[] {
    const delta = new DocumentDelta(document.ops)
    return delta.getSelected(Selection.fromShape(document.currentSelection)).ops
  }

  private shouldFocusOnLeftEdge() {
    return this.kind === 'text' || this.descriptor.blockIndex === 0
  }

  public isFocused({ currentSelection }: Document): boolean {
    const { selectableUnitsOffset, numOfSelectableUnits } = this.descriptor
    const lowerBoundary = selectableUnitsOffset
    const upperBoundary = selectableUnitsOffset + numOfSelectableUnits
    const nextBlock = this.getNextBlock()
    const isCursor = currentSelection.end - currentSelection.start === 0
    const isCursorTouchingRightEdge = isCursor && currentSelection.end === upperBoundary
    const isCursorTouchingLeftEdge = isCursor && currentSelection.start === lowerBoundary
    if (isCursorTouchingRightEdge) {
      return nextBlock == null || !nextBlock.shouldFocusOnLeftEdge()
    }
    if (isCursorTouchingLeftEdge) {
      return this.shouldFocusOnLeftEdge()
    }
    return (
      currentSelection.start >= lowerBoundary &&
      currentSelection.start <= upperBoundary &&
      currentSelection.end <= upperBoundary
    )
  }

  public isEntirelySelected({ currentSelection: { start, end } }: Document) {
    return (
      start === this.descriptor.selectableUnitsOffset &&
      end === this.descriptor.selectableUnitsOffset + this.descriptor.numOfSelectableUnits
    )
  }

  public updateTextAttributesAtSelection(document: Document): Document {
    const docDelta = new DocumentDelta(document.ops)
    const deltaAttributes = docDelta.getSelectedTextAttributes(Selection.fromShape(document.currentSelection))
    return {
      ...document,
      selectedTextAttributes: deltaAttributes,
    }
  }

  public applyAtomicDeltaUpdate(
    { diff, selectionAfterChange }: DocumentDeltaAtomicUpdate,
    document: Document,
  ): Document {
    return {
      ...this.applyBlockScopedDiff(diff, document),
      currentSelection: this.getDocumentSelection(selectionAfterChange),
    }
  }

  public applyTextTransformToSelection(
    attributeName: string,
    attributeValue: Attributes.GenericValue,
    document: Document,
  ): Document {
    if (this.kind !== 'text') {
      return document
    }
    return {
      ...document,
      ...applyTextTransformToSelection(attributeName, attributeValue, document),
    }
  }

  /**
   * Insert element at selection.
   *
   * @remarks If selection is of length 1+, replace the selectable units encompassed by selection.
   *
   * @param element - The element to be inserted.
   * @param document - The document.
   *
   * @returns The resulting document.
   */
  public insertOrReplaceAtSelection(element: Bridge.Element<any>, document: Document): Document {
    const deletionLength = document.currentSelection.end - document.currentSelection.start
    const diff = new Delta()
      .retain(document.currentSelection.start)
      .delete(deletionLength)
      .insert(...elementToInsertion(element, document))
    return this.applyDiffToDocument(diff, document)
  }

  /**
   * Remove this block. If this block is the first block, replace with default text block.
   *
   * @param document - The document to which it should apply.
   */
  public remove(document: Document): Document {
    if (this.isFirst() && this.isLast()) {
      return buildInitialDocContent()
    }
    const diff = new Delta().retain(this.descriptor.selectableUnitsOffset).delete(this.descriptor.numOfSelectableUnits)
    return this.applyDiffToDocument(diff, document)
  }

  public updateSelection(blockScopedSelection: SelectionShape, document: Document): Document {
    const nextSelection = {
      start: this.descriptor.selectableUnitsOffset + blockScopedSelection.start,
      end: this.descriptor.selectableUnitsOffset + blockScopedSelection.end,
    }
    return {
      ...document,
      currentSelection: nextSelection,
    }
  }

  /**
   * Select the whole block.
   *
   * @param document - The document to which the mutation should apply.
   *
   * @returns The resulting document.
   */
  public select(document: Document): Document {
    const nextSelection = {
      start: this.descriptor.selectableUnitsOffset,
      end: this.descriptor.selectableUnitsOffset + this.descriptor.numOfSelectableUnits,
    }
    return {
      ...document,
      currentSelection: nextSelection,
    }
  }

  /**
   * Remove one selectable unit before cursor.
   *
   * @param document The document to which the mutation should apply.
   *
   * @returns The resulting document.
   */
  public removeOneBefore(document: Document): Document {
    if (this.isFirst()) {
      return document
    }
    const diff = new Delta().retain(this.descriptor.selectableUnitsOffset - 1).delete(1)
    const prevBlock = this.getPreviousBlock() as Block
    if (prevBlock.kind === 'image') {
      return prevBlock.select(document)
    }
    return this.applyDiffToDocument(diff, document)
  }

  public moveBefore(document: Document): Document {
    if (this.isFirst()) {
      return document
    }
    const positionBeforeBlock = this.descriptor.selectableUnitsOffset - 1
    return this.applyCursorTranslationToDocument(positionBeforeBlock, document)
  }

  public moveAfter(document: Document): Document {
    if (this.isLast()) {
      return document
    }
    const positionAfterBlock = this.descriptor.selectableUnitsOffset + this.descriptor.numOfSelectableUnits
    return this.applyCursorTranslationToDocument(positionAfterBlock, document)
  }
}
