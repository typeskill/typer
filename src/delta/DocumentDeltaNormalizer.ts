import Delta from 'quill-delta'
import { DocumentDelta } from './DocumentDelta'
import { NormalizeDirective, NormalizeOperation } from './DeltaDiffComputer'
import { Selection } from './Selection'
import { DeltaBuffer } from './DeltaBuffer'
import { LineWalker, DocumentLine } from './LineWalker'
import { getHeadingCharactersFromType, isLineTypeTextLengthModifier } from './lines'
import { isMutatingDelta } from './generic'
import { DeltaChangeContext } from '@delta/DeltaChangeContext'
import filter from 'ramda/es/filter'
import prop from 'ramda/es/prop'
import zip from 'ramda/es/zip'

interface HandlerContext {
  overridingSelection: null | Selection
  readonly requiredPrefix: string
  readonly changeContext: DeltaChangeContext
  readonly lineDiff: Delta
  readonly beginningOfLineIndex: number
  readonly lineLength: number
  readonly diffDelta: Delta
}
export class DocumentDeltaNormalizer {
  private documentDelta: DocumentDelta

  public constructor(documentDelta: DocumentDelta) {
    this.documentDelta = documentDelta
  }

  private handleInvestigateDeletion(context: HandlerContext) {
    const { changeContext, lineDiff, diffDelta, requiredPrefix } = context
    if (isMutatingDelta(lineDiff.slice(0, requiredPrefix.length))) {
      const iterator = Delta.Op.iterator(lineDiff.ops)
      let index = 0
      let stopIndex = requiredPrefix.length
      let remainingRetains = context.lineLength
      while (iterator.hasNext()) {
        const next = iterator.next()
        if (next.retain) {
          const retainSelection = Selection.fromBounds(index, index + next.retain)
          const stopIndexSelection = Selection.fromBounds(0, stopIndex)
          const numToDelete = retainSelection.intersectionLength(stopIndexSelection)
          diffDelta.delete(numToDelete)
          remainingRetains -= numToDelete
          index += next.retain
        } else if (typeof next.insert === 'string') {
          stopIndex = Math.min(index, requiredPrefix.length)
          remainingRetains -= next.insert.length
          diffDelta.retain(next.insert.length)
          index += next.insert.length
        } else if (next.delete) {
          index += next.delete
        }
      }
      diffDelta.retain(remainingRetains)
      diffDelta.retain(1, { $type: null })
      context.overridingSelection = Selection.fromBounds(
        lineDiff.compose(diffDelta).transformPosition(changeContext.selectionBeforeChange.start),
      )
    } else {
      this.retainLine(context)
    }
  }

  private handleCheckPrefix(context: HandlerContext) {
    const { lineDiff, requiredPrefix, changeContext, diffDelta } = context
    if (isMutatingDelta(lineDiff.slice(0, requiredPrefix.length))) {
      const iterator = Delta.Op.iterator(lineDiff.ops)
      let index = 0
      while (iterator.hasNext()) {
        const next = iterator.next()
        if (next.retain) {
          diffDelta.retain(next.retain)
          index += next.retain
        } else if (typeof next.insert === 'string') {
          if (index < requiredPrefix.length) {
            const numFromPrefixToInsert = requiredPrefix.length - index
            diffDelta.insert(requiredPrefix.slice(index, index + numFromPrefixToInsert))
            index += numFromPrefixToInsert
          } else {
            diffDelta.insert(next.insert)
            index += next.insert.length
          }
        } else if (next.delete) {
          diffDelta.delete(next.delete)
          index += next.delete
        }
      }
      diffDelta.retain(1)
      context.overridingSelection = Selection.fromBounds(
        lineDiff.compose(diffDelta).transformPosition(changeContext.selectionAfterChange.start),
      )
    } else {
      this.retainLine(context)
    }
  }

  private handleInsertion(context: HandlerContext) {
    const { changeContext, requiredPrefix, lineLength } = context
    context.diffDelta.insert(requiredPrefix)
    context.diffDelta.retain(lineLength + 1)
    context.overridingSelection = Selection.fromBounds(changeContext.selectionAfterChange.end + requiredPrefix.length)
  }

  private retainLine(context: HandlerContext) {
    context.diffDelta.retain(context.lineLength + 1)
  }

  public apply(directives: NormalizeDirective[]): { delta: DocumentDelta; overridingSelection: Selection | null } {
    const diffBuffer = new DeltaBuffer()
    let overridingSelection: Selection | null = null
    const lines = new LineWalker(this.documentDelta).getLines()
    const directivesLines = directives.map(prop('beginningOfLineIndex'))
    const linesWithDirectives = filter<DocumentLine>(line => directivesLines.includes(line.lineRange.start))(lines)
    const linesAndDirectives = zip(linesWithDirectives, directives)
    let lastLineIndex = 0
    for (const [line, directive] of linesAndDirectives) {
      const { beginningOfLineIndex: directiveIndex } = directive
      const { lineType, lineTypeIndex, lineRange } = line
      const { selectionAfterChange } = directive.context
      const requiredPrefix = getHeadingCharactersFromType(lineType, lineTypeIndex)
      const matchingLine = directiveIndex === lineRange.start
      const lineDiff = directive.diff
      const relativeCursorPosition = selectionAfterChange.start - lineRange.start
      const shouldInvestigatePrefix = matchingLine && directive.type === NormalizeOperation.CHECK_LINE_TYPE_PREFIX
      const shouldApplyInsertion = matchingLine && directive.type === NormalizeOperation.INSERT_LINE_TYPE_PREFIX
      const shouldApplyDeletion =
        matchingLine &&
        directive.type === NormalizeOperation.INVESTIGATE_DELETION &&
        relativeCursorPosition <= requiredPrefix.length &&
        isLineTypeTextLengthModifier(line.lineType)
      const handlerContext: HandlerContext = {
        lineDiff,
        requiredPrefix,
        beginningOfLineIndex: lineRange.start,
        lineLength: line.delta.length(),
        overridingSelection: null,
        changeContext: directive.context,
        diffDelta: new Delta().retain(line.lineRange.start - lastLineIndex),
      }
      if (shouldApplyInsertion) {
        this.handleInsertion(handlerContext)
      } else if (shouldApplyDeletion) {
        this.handleInvestigateDeletion(handlerContext)
      } else if (shouldInvestigatePrefix) {
        this.handleCheckPrefix(handlerContext)
      } else {
        this.retainLine(handlerContext)
      }
      diffBuffer.push(handlerContext.diffDelta)
      overridingSelection = handlerContext.overridingSelection || overridingSelection
      lastLineIndex = lineRange.end + 1
    }
    const diff = diffBuffer.compose()
    return {
      overridingSelection,
      delta: isMutatingDelta(diff) ? this.documentDelta.compose(diff) : this.documentDelta,
    }
  }
}
