import { BlockDescriptor } from './blocks'
import { DocumentContent, applyTextTransformToSelection, buildInitialDocContent } from './documents'
import { SelectionShape, Selection } from '@delta/Selection'
import Delta from 'quill-delta'
import { ImageKind, GenericOp } from '@delta/operations'
import { DocumentDelta } from '@delta/DocumentDelta'
import { Attributes } from '@delta/attributes'
import { Bridge } from '@core/Bridge'

function elementToInsertion(
  element: Bridge.Element<any>,
  document: DocumentContent,
): [ImageKind | string, Attributes.Map] {
  return element.type === 'text'
    ? [element.content, document.selectedTextAttributes]
    : [{ kind: 'image' }, element.description]
}

function getSelectionAfterTransform(diff: Delta, document: DocumentContent): SelectionShape {
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

  private isFirst(): boolean {
    return this.descriptor.blockIndex === 0
  }

  private isLast(): boolean {
    return this.descriptor.blockIndex === this.descriptor.maxBlockIndex
  }

  private applyCursorTranslationToDocument(position: number, document: DocumentContent): DocumentContent {
    const nextSelection: SelectionShape = {
      start: position,
      end: position,
    }
    return {
      ...document,
      currentSelection: nextSelection,
    }
  }

  private applyDiffToDocument(diff: Delta, document: DocumentContent): DocumentContent {
    const current = new Delta(document.ops)
    const nextDelta = current.compose(diff)
    const nextOps = nextDelta.ops
    const nextSelection = getSelectionAfterTransform(diff, document)
    return {
      ...document,
      currentSelection: nextSelection,
      ops: nextOps,
    }
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

  public getScopedSelection(document: DocumentContent): SelectionShape {
    return {
      start: document.currentSelection.start - this.descriptor.selectableUnitsOffset,
      end: document.currentSelection.end - this.descriptor.selectableUnitsOffset,
    }
  }

  public getSelectedOps(document: DocumentContent): GenericOp[] {
    const delta = new DocumentDelta(document.ops)
    return delta.getSelected(Selection.fromShape(document.currentSelection)).ops
  }

  private shouldFocusOnLeftEdge() {
    return this.kind === 'text' || this.descriptor.blockIndex === 0
  }

  public isFocused({ currentSelection }: DocumentContent): boolean {
    const { selectableUnitsOffset, numOfSelectableUnits } = this.descriptor
    const lowerBoundary = selectableUnitsOffset
    const upperBoundary = selectableUnitsOffset + numOfSelectableUnits
    const nextBlock = this.getNextBlock()
    const isCursor = currentSelection.end - currentSelection.start === 0
    const isCursorTouchingRightEdge = isCursor && currentSelection.end === upperBoundary
    const isCursorTouchingLeftEdge = isCursor && currentSelection.start === lowerBoundary
    if (isCursorTouchingRightEdge) {
      return nextBlock === null || !nextBlock.shouldFocusOnLeftEdge()
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

  public isEntirelySelected({ currentSelection: { start, end } }: DocumentContent) {
    return (
      start === this.descriptor.selectableUnitsOffset &&
      end === this.descriptor.selectableUnitsOffset + this.descriptor.numOfSelectableUnits
    )
  }

  /**
   * Mutate block-scoped ops in the document.
   *
   * @param diff - The diff delta to apply to current block.
   * @param document - The document.
   *
   * @returns The resulting document ops.
   */
  public applyDiff(diff: Delta, document: DocumentContent): DocumentContent {
    let fullDiff = new Delta().retain(this.descriptor.selectableUnitsOffset).concat(diff)
    return this.applyDiffToDocument(fullDiff, document)
  }

  public updateTextAttributesAtSelection(document: DocumentContent): DocumentContent {
    const docDelta = new DocumentDelta(document.ops)
    const deltaAttributes = docDelta.getSelectedTextAttributes(Selection.fromShape(document.currentSelection))
    return {
      ...document,
      selectedTextAttributes: deltaAttributes,
    }
  }

  public applyTextTransformToSelection(
    attributeName: string,
    attributeValue: Attributes.GenericValue,
    document: DocumentContent,
  ): DocumentContent {
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
  public insertOrReplaceAtSelection(element: Bridge.Element<any>, document: DocumentContent): DocumentContent {
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
  public remove(document: DocumentContent): DocumentContent {
    if (this.isFirst() && this.isLast()) {
      return buildInitialDocContent()
    }
    const diff = new Delta().retain(this.descriptor.selectableUnitsOffset).delete(this.descriptor.numOfSelectableUnits)
    return this.applyDiffToDocument(diff, document)
  }

  public updateSelection(blockScopedSelection: SelectionShape, document: DocumentContent): DocumentContent {
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
  public select(document: DocumentContent): DocumentContent {
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
  public removeOneBefore(document: DocumentContent): DocumentContent {
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

  public moveBefore(document: DocumentContent): DocumentContent {
    if (this.isFirst()) {
      return document
    }
    const positionBeforeBlock = this.descriptor.selectableUnitsOffset - 1
    return this.applyCursorTranslationToDocument(positionBeforeBlock, document)
  }

  public moveAfter(document: DocumentContent): DocumentContent {
    if (this.isLast()) {
      return document
    }
    const positionAfterBlock = this.descriptor.selectableUnitsOffset + this.descriptor.numOfSelectableUnits
    return this.applyCursorTranslationToDocument(positionAfterBlock, document)
  }
}
