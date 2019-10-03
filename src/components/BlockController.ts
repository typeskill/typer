import { Block } from '@model/Block'
import { Document } from '@model/document'
import { SelectionShape } from '@delta/Selection'
import { DocumentDeltaAtomicUpdate } from '@delta/DocumentDeltaAtomicUpdate'
import { ImageOp } from '@delta/operations'
import { Images } from '@core/Images'

export interface DocumentProvider {
  getDocument: () => Document
  updateDocument: (document: Document) => void
  getImageHooks: () => Images.Hooks<any>
  overrideSelection: (overridingSelection: SelectionShape) => void
}

export class BlockController {
  private block: Block
  private provider: DocumentProvider

  public constructor(block: Block, provider: DocumentProvider) {
    this.block = block
    this.provider = provider
  }

  private getDocument(): Document {
    return this.provider.getDocument()
  }

  private updateDocumentContent(document: Document) {
    this.provider.updateDocument(document)
  }

  private onBlockDeletion() {
    if (this.block.kind === 'image') {
      const [imageOp] = this.block.getSelectedOps(this.getDocument()) as [ImageOp<any>]
      const hooks = this.provider.getImageHooks()
      hooks.onImageRemovedEvent && hooks.onImageRemovedEvent(imageOp.insert)
    }
  }

  public updateSelectionInBlock(blockScopedSelection: SelectionShape, override?: boolean) {
    const nextDocument = this.block.updateSelection(blockScopedSelection, this.getDocument())
    this.updateDocumentContent(nextDocument)
    if (override) {
      this.provider.overrideSelection(nextDocument.currentSelection)
    }
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
    const nextDoc = this.block.moveBefore(this.getDocument())
    this.updateDocumentContent(nextDoc)
  }
}
