import { Block } from '@model/Block'
import { Document } from '@model/document'
import { SelectionShape } from '@delta/Selection'
import { Gen } from '@core/Gen'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'

export interface DocumentProvider {
  getDocument: () => Document
  updateDocument: (document: Document) => void
  getGenService: () => Gen.Service
}

export class BlockController {
  public constructor(private block: Block, private provider: DocumentProvider) {}

  private getDocument(): Document {
    return this.provider.getDocument()
  }

  private updateDocumentContent(document: Document) {
    this.provider.updateDocument(document)
  }

  private onBlockDeletion() {
    if (this.block.kind === 'image') {
      const [imageOp] = this.block.getSelectedOps(this.getDocument())
      const locator = this.provider.getGenService().imageLocator
      locator.onImageRemovedEvent && locator.onImageRemovedEvent(imageOp.attributes)
    }
  }

  public updateSelectionInBlock(blockScopedSelection: SelectionShape) {
    this.updateDocumentContent(this.block.updateSelection(blockScopedSelection, this.getDocument()))
  }

  public applyAtomicDeltaUpdateInBlock(documentDeltaUpdate: DocumentDeltaAtomicUpdate) {
    this.updateDocumentContent(this.block.applyAtomicDeltaUpdate(documentDeltaUpdate, this.getDocument()))
  }

  public selectBlock() {
    this.updateDocumentContent(this.block.select(this.getDocument()))
  }

  public removeCurrentBlock() {
    this.updateDocumentContent(this.block.remove(this.getDocument()))
    this.onBlockDeletion()
  }

  public insertOrReplaceTextAtSelection(character: string) {
    const actionWillDeleteBlock = this.block.isEntirelySelected(this.getDocument())
    this.updateDocumentContent(
      this.block.insertOrReplaceAtSelection({ type: 'text', content: character }, this.getDocument()),
    )
    actionWillDeleteBlock && this.onBlockDeletion()
  }

  public removeOneBeforeBlock() {
    this.updateDocumentContent(this.block.removeOneBefore(this.getDocument()))
  }

  public moveAfterBlock() {
    this.updateDocumentContent(this.block.moveAfter(this.getDocument()))
  }

  public moveBeforeBlock() {
    this.updateDocumentContent(this.block.moveBefore(this.getDocument()))
  }
}
