import { NormalizeDirective, NormalizeOperation } from './DeltaDiffComputer'
import { DeltaChangeContext } from 'index'

export class NormalizeDirectiveBuilder {
  private directives: NormalizeDirective[] = []
  private context: DeltaChangeContext

  constructor(context: DeltaChangeContext) {
    this.context = context
  }

  pushDirective(type: NormalizeOperation, beginningOfLineIndex: number) {
    this.directives.push({
      type,
      beginningOfLineIndex,
      context: this.context
    })
  }

  build() {
    return this.directives
  }
}
