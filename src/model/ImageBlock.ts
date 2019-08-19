import { Block } from './Block'
// import { Selection } from '@delta/Selection'
import { Document } from './Document'

export class ImageBlock<D extends {}> extends Block {
  private imageDescriptor: D
  public constructor(blockInterface: Document.BlockInterface, imageDescriptor: D) {
    super(blockInterface)
    this.imageDescriptor = imageDescriptor
  }

  public getLength(): number {
    return 2
  }

  public handleOnSelectionChange(/*s: Selection*/): void {
    // Void
  }

  public getImageDescription(): D {
    return this.imageDescriptor
  }
}
