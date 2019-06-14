import { NormalizeDirective, NormalizeOperation } from './DeltaDiffComputer'
import { DeltaChangeContext } from 'index'
import Delta from 'quill-delta'

export class NormalizeDirectiveBuilder {
  private directives: NormalizeDirective[] = []
  private context: DeltaChangeContext

  public constructor(context: DeltaChangeContext) {
    this.context = context
  }

  public pushDirective(type: NormalizeOperation, beginningOfLineIndex: number, diff: Delta) {
    this.directives.push({
      type,
      diff,
      beginningOfLineIndex,
      context: this.context,
    })
  }

  public build() {
    return this.directives
  }
}
