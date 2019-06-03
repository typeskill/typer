import Delta from 'quill-delta'
import DocumentDelta from './DocumentDelta'
import { BlockAttributesMap, mergeAttributesRight } from './attributes'
import { DeltaChangeContext } from './DeltaChangeContext'
import Text, { TextDiffContext } from './Text'
import { NormalizeDirectiveBuilder } from './NormalizeDirectiveBuilder'

export enum NormalizeOperation {
  INSERT_LINE_TYPE_PREFIX,
  INVESTIGATE_DELETION
}

export interface NormalizeDirective {
  type: NormalizeOperation,
  beginningOfLineIndex: number,
  context: DeltaChangeContext
}

export interface DeltaDiffReport {
  delta: Delta,
  directives: NormalizeDirective[]
}

export interface DeltaDiffModel {
  readonly oldText: string
  readonly newText: string
  readonly context: DeltaChangeContext
  readonly cursorTextAttributes: BlockAttributesMap
}

export class DeltaDiffComputer {

  private readonly diffContext: TextDiffContext

  constructor(model: DeltaDiffModel, delta: DocumentDelta) {
    const { context, cursorTextAttributes, newText: newTextRaw, oldText: oldTextRaw } = model
    const selectedTextAttributes = delta.getSelectedTextAttributes(context.selectionBeforeChange)
    const selectionBeforeChangeLength = context.selectionBeforeChange.end - context.selectionBeforeChange.start
    const textAttributes = selectionBeforeChangeLength ? selectedTextAttributes : mergeAttributesRight(selectedTextAttributes, cursorTextAttributes)
    const lineTypeBeforeChange = delta.getLineTypeInSelection(context.selectionBeforeChange)
    const oldText = new Text(oldTextRaw)
    const newText = new Text(newTextRaw)
    const directiveBuilder = new NormalizeDirectiveBuilder(context)
    const lineAttributes = lineTypeBeforeChange === 'normal' ? {} : { $type: lineTypeBeforeChange }
    this.diffContext = {
      context,
      oldText,
      newText,
      textAttributes,
      lineAttributes,
      directiveBuilder,
      lineTypeBeforeChange
    }
  }

  toDeltaDiffReport(): DeltaDiffReport {
    const { oldText, directiveBuilder } = this.diffContext
    const delta = oldText.computeGenericDelta(this.diffContext)
    return { delta, directives: directiveBuilder.build() }
  }
}
