import Delta from 'quill-delta'
import { DocumentDelta } from './DocumentDelta'
import { Attributes, mergeAttributesRight } from './attributes'
import { DeltaChangeContext } from './DeltaChangeContext'
import { Text, TextLine } from './Text'
import { Selection } from './Selection'
import { DeltaBuffer } from './DeltaBuffer'
import { makeDiffDelta } from './diff'
import zip from 'ramda/es/zip'
import { KeyValuePair } from 'ramda'

export enum NormalizeOperation {
  INSERT_LINE_TYPE_PREFIX,
  INVESTIGATE_DELETION,
  CHECK_LINE_TYPE_PREFIX,
}

export interface DeltaDiffReport {
  delta: Delta
}

interface TextDiffContext {
  readonly textAttributes: Attributes.Map
  readonly lineAttributes: Attributes.Map
  readonly lineTypeBeforeChange: Attributes.LineType
  readonly context: DeltaChangeContext
  readonly oldText: Text
  readonly newText: Text
}

export interface DeltaDiffModel {
  readonly oldText: string
  readonly newText: string
  readonly context: DeltaChangeContext
  readonly cursorTextAttributes: Attributes.Map
}

export class DeltaDiffComputer {
  private readonly diffContext: TextDiffContext

  public constructor(model: DeltaDiffModel, delta: DocumentDelta) {
    const { context, cursorTextAttributes, newText: newTextRaw, oldText: oldTextRaw } = model
    const selectedTextAttributes = delta.getSelectedTextAttributes(context.selectionBeforeChange)
    const selectionBeforeChangeLength = context.selectionBeforeChange.end - context.selectionBeforeChange.start
    const textAttributes = selectionBeforeChangeLength
      ? selectedTextAttributes
      : mergeAttributesRight(selectedTextAttributes, cursorTextAttributes)
    const lineTypeBeforeChange = delta.getLineTypeInSelection(context.selectionBeforeChange)
    const oldText = new Text(oldTextRaw)
    const newText = new Text(newTextRaw)
    const lineAttributes = lineTypeBeforeChange === 'normal' ? {} : { $type: lineTypeBeforeChange }
    this.diffContext = {
      context,
      oldText,
      newText,
      textAttributes,
      lineAttributes,
      lineTypeBeforeChange,
    }
  }

  private computeGenericDelta(originalText: Text, diffContext: TextDiffContext): Delta {
    const { context, newText, textAttributes } = diffContext
    const lineBeforeChangeSelection = originalText.getSelectionEncompassingLines(context.selectionBeforeChange)
    const lineAfterChangeSelection = newText.getSelectionEncompassingLines(context.selectionAfterChange)
    const lineChangeContext = new DeltaChangeContext(lineBeforeChangeSelection, lineAfterChangeSelection)
    const selectionTraversalBeforeChange = lineChangeContext.deleteTraversal()
    const selectionTraversalAfterChange = Selection.between(
      selectionTraversalBeforeChange.start,
      lineAfterChangeSelection.end,
    )
    const textBeforeChange = originalText.select(selectionTraversalBeforeChange)
    const textAfterChange = newText.select(selectionTraversalAfterChange)
    const delta = new Delta()
      .retain(selectionTraversalBeforeChange.start)
      .concat(makeDiffDelta(textBeforeChange.raw, textAfterChange.raw, textAttributes))
      .retain(originalText.length - selectionTraversalBeforeChange.end)
    return delta
  }

  public toDeltaDiffReport(): DeltaDiffReport {
    const { oldText } = this.diffContext
    const delta = this.computeGenericDelta(oldText, this.diffContext)
    return { delta }
  }
}
