import { Block } from './Block'
import { groupOpsByBlocks } from './blocks'
import { Document } from './document'
import { Bridge } from '@core/Bridge'
import { Attributes } from '@delta/attributes'
import { DocumentDelta } from '@delta/DocumentDelta'
import { SelectionShape } from '@delta/Selection'

/**
 * An object to manipulate blocks.
 */
export class BlockAssembler {
  private blocks: Block[]
  private document: Document
  public constructor(document: Document) {
    this.document = document
    this.blocks = groupOpsByBlocks(document.ops)
  }

  private getActiveBlock(): Block | null {
    for (const block of this.blocks) {
      if (block.isFocused(this.document)) {
        return block
      }
    }
    return null
  }

  public getBlocks(): Block[] {
    return this.blocks
  }

  public insertOrReplaceAtSelection(element: Bridge.Element<any>): Document {
    const activeBlock = this.getActiveBlock() as Block
    return activeBlock.insertOrReplaceAtSelection(element, this.document)
  }

  public updateTextAttributesAtSelection(): Document {
    const document = this.document
    const docDelta = new DocumentDelta(document.ops)
    const deltaAttributes = docDelta.getSelectedTextAttributes(document.currentSelection)
    return {
      ...document,
      selectedTextAttributes: deltaAttributes,
    }
  }

  public applyTextTransformToSelection(attributeName: string, attributeValue: Attributes.GenericValue): Document {
    const activeBlock = this.getActiveBlock() as Block
    return activeBlock.applyTextTransformToSelection(attributeName, attributeValue, this.document)
  }

  public getActiveBlockScopedSelection(): SelectionShape {
    const activeBlock = this.getActiveBlock() as Block
    return activeBlock.getBlockScopedSelection(this.document) as SelectionShape
  }
}
