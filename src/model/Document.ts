import { Block } from './Block'
import { groupOpsByBlocks } from './blocks'
import { DocumentContent } from './documents'
import { Bridge } from '@core/Bridge'
import { Attributes } from '@delta/attributes'
import { DocumentDelta } from '@delta/DocumentDelta'
import { SelectionShape } from '@delta/Selection'

/**
 * An object representing the content of a Sheet, and providing an interface to operate.
 */
export class Document {
  private blocks: Block[]
  private documentContent: DocumentContent
  public constructor(documentContent: DocumentContent) {
    this.documentContent = documentContent
    this.blocks = groupOpsByBlocks(documentContent.ops)
  }

  private getActiveBlock(): Block | null {
    for (const block of this.blocks) {
      if (block.isFocused(this.documentContent)) {
        return block
      }
    }
    return null
  }

  public getBlocks(): Block[] {
    return this.blocks
  }

  public insertOrReplaceAtSelection(element: Bridge.Element<any>): DocumentContent {
    const activeBlock = this.getActiveBlock() as Block
    return activeBlock.insertOrReplaceAtSelection(element, this.documentContent)
  }

  public updateTextAttributesAtSelection(): DocumentContent {
    const document = this.documentContent
    const docDelta = new DocumentDelta(document.ops)
    const deltaAttributes = docDelta.getSelectedTextAttributes(document.currentSelection)
    return {
      ...document,
      selectedTextAttributes: deltaAttributes,
    }
  }

  public applyTextTransformToSelection(
    attributeName: string,
    attributeValue: Attributes.GenericValue,
  ): DocumentContent {
    const activeBlock = this.getActiveBlock() as Block
    return activeBlock.applyTextTransformToSelection(attributeName, attributeValue, this.documentContent)
  }

  public getActiveBlockScopedSelection(): SelectionShape {
    const activeBlock = this.getActiveBlock() as Block
    return activeBlock.getScopedSelection(this.documentContent)
  }
}
