import { Block } from '@model/Block'
import { DocumentContent } from '@model/documents'
import { SelectionShape } from '@delta/Selection'
import Delta from 'quill-delta'
import { Gen } from '@core/Gen'

export interface DocumentProvider {
  getDocumentContent: () => DocumentContent
  updateDocumentContent: (documentContent: DocumentContent) => void
  getRendererService: () => Gen.Service
}

export class DocumentController {
  public constructor(private block: Block, private provider: DocumentProvider) {}

  private getDocumentContent(): DocumentContent {
    return this.provider.getDocumentContent()
  }

  private updateDocumentContent(documentContent: DocumentContent) {
    this.provider.updateDocumentContent(documentContent)
  }

  private onBlockDeletion() {
    if (this.block.kind === 'image') {
      const [imageOp] = this.block.getSelectedOps(this.getDocumentContent())
      const locator = this.provider.getRendererService().imageLocator
      locator.onImageRemovedEvent && locator.onImageRemovedEvent(imageOp.attributes)
    }
  }

  public updateSelectionInBlock(blockScopedSelection: SelectionShape) {
    this.updateDocumentContent(this.block.updateSelection(blockScopedSelection, this.getDocumentContent()))
  }

  public applyDiffInBlock(diff: Delta) {
    this.updateDocumentContent(this.block.applyDiff(diff, this.getDocumentContent()))
  }

  public selectBlock() {
    this.updateDocumentContent(this.block.select(this.getDocumentContent()))
  }

  public removeCurrentBlock() {
    this.updateDocumentContent(this.block.remove(this.getDocumentContent()))
    this.onBlockDeletion()
  }
  public insertOrReplaceTextAtSelection(character: string) {
    const actionWillDeleteBlock = this.block.isEntirelySelected(this.getDocumentContent())
    this.updateDocumentContent(
      this.block.insertOrReplaceAtSelection({ type: 'text', content: character }, this.getDocumentContent()),
    )
    actionWillDeleteBlock && this.onBlockDeletion()
  }
  public removeOneBeforeBlock() {
    this.updateDocumentContent(this.block.removeOneBefore(this.getDocumentContent()))
  }
  public moveAfterBlock() {
    this.updateDocumentContent(this.block.moveAfter(this.getDocumentContent()))
  }
  public moveBeforeBlock() {
    this.updateDocumentContent(this.block.moveBefore(this.getDocumentContent()))
  }
}
