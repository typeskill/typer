import Delta from 'quill-delta'
import { DocumentDelta } from './DocumentDelta'
import { Attributes, mergeAttributesLeft } from './attributes'
import { DeltaChangeContext } from './DeltaChangeContext'
import { Text } from './Text'
import { NormalizeDirectiveBuilder } from './NormalizeDirectiveBuilder'
import { Selection } from './Selection'
import { DeltaBuffer } from './DeltaBuffer'
import { shouldLineTypePropagateToNextLine, getLineType, isLineTypeTextLengthModifier } from './lines'
import { makeDiffDelta } from './diff'
import zip from 'ramda/es/zip'

export enum NormalizeOperation {
  INSERT_LINE_TYPE_PREFIX,
  INVESTIGATE_DELETION,
  CHECK_LINE_TYPE_PREFIX,
}

export interface NormalizeDirective {
  type: NormalizeOperation
  beginningOfLineIndex: number
  context: DeltaChangeContext
  diff: Delta
}

export interface DeltaDiffReport {
  delta: Delta
  directives: NormalizeDirective[]
}

interface TextDiffContext {
  readonly textAttributes: Attributes.Map
  readonly lineAttributes: Attributes.Map
  readonly lineTypeBeforeChange: Attributes.LineType
  readonly context: DeltaChangeContext
  readonly oldText: Text
  readonly newText: Text
  readonly directiveBuilder: NormalizeDirectiveBuilder
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
      : mergeAttributesLeft(selectedTextAttributes, cursorTextAttributes)
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
      lineTypeBeforeChange,
    }
  }

  private computeGenericDelta(originalText: Text, diffContext: TextDiffContext): Delta {
    const { context, newText, textAttributes, lineTypeBeforeChange, lineAttributes, directiveBuilder } = diffContext
    const lineBeforeChangeSelection = originalText.getSelectionEncompassingLines(context.selectionBeforeChange)
    const lineAfterChangeSelection = newText.getSelectionEncompassingLines(context.selectionAfterChange)
    const lineChangeContext = new DeltaChangeContext(lineBeforeChangeSelection, lineAfterChangeSelection)
    const selectionTraversalBeforeChange = lineChangeContext.deleteTraversal()
    const selectionTraversalAfterChange = Selection.between(
      selectionTraversalBeforeChange.start,
      lineAfterChangeSelection.end,
    )
    const buffer = new DeltaBuffer()
    const textBeforeChange = originalText.select(selectionTraversalBeforeChange)
    const textAfterChange = newText.select(selectionTraversalAfterChange)
    const linesBeforeChange = textBeforeChange.getLines()
    const linesAfterChange = textAfterChange.getLines()
    buffer.push(new Delta().retain(selectionTraversalBeforeChange.start))
    const shouldPropagateLineType = shouldLineTypePropagateToNextLine(lineTypeBeforeChange)
    const replacedLines = zip(linesBeforeChange, linesAfterChange)
    const lineType = getLineType(lineAttributes)
    let shouldDeleteNextNewline = false
    // Replaced lines
    replacedLines.forEach(([lineBefore, lineAfter]) => {
      const lineDelta = makeDiffDelta(lineBefore.text, lineAfter.text, textAttributes)
      if (
        isLineTypeTextLengthModifier(lineType) &&
        context.isDeletion() &&
        lineAfter.lineRange.touchesSelection(context.selectionAfterChange)
      ) {
        directiveBuilder.pushDirective(NormalizeOperation.INVESTIGATE_DELETION, lineAfter.lineRange.start, lineDelta)
      } else if (isLineTypeTextLengthModifier(lineType)) {
        directiveBuilder.pushDirective(NormalizeOperation.CHECK_LINE_TYPE_PREFIX, lineAfter.lineRange.start, lineDelta)
      }
      if (originalText.charAt(lineBefore.lineRange.end) !== '\n') {
        lineDelta.insert('\n', shouldPropagateLineType ? lineAttributes : {})
      } else {
        lineDelta.retain(1) // Keep first newline
        shouldDeleteNextNewline =
          context.isDeletion() && selectionTraversalBeforeChange.touchesIndex(lineBefore.lineRange.end)
      }
      buffer.push(lineDelta)
    })
    // Inserted lines
    linesAfterChange.slice(replacedLines.length).forEach(lineAfter => {
      const lineDelta = makeDiffDelta('', lineAfter.text, textAttributes)
      lineDelta.insert('\n', shouldPropagateLineType ? lineAttributes : {})
      if (isLineTypeTextLengthModifier(lineTypeBeforeChange)) {
        directiveBuilder.pushDirective(NormalizeOperation.INSERT_LINE_TYPE_PREFIX, lineAfter.lineRange.start, lineDelta)
      }
      buffer.push(lineDelta)
    })
    // Deleted lines
    linesBeforeChange.slice(replacedLines.length).forEach(lineBefore => {
      const { start: beginningOfLineIndex } = lineBefore.lineRange
      const lineDelta = makeDiffDelta(lineBefore.text, '', textAttributes)
      if (beginningOfLineIndex < selectionTraversalBeforeChange.end || shouldDeleteNextNewline) {
        lineDelta.delete(1)
        shouldDeleteNextNewline = false
      }
      buffer.push(lineDelta)
    })
    return buffer.compose()
  }

  public toDeltaDiffReport(): DeltaDiffReport {
    const { oldText, directiveBuilder } = this.diffContext
    const delta = this.computeGenericDelta(oldText, this.diffContext)
    const directives = directiveBuilder.build()
    return { delta, directives }
  }
}
