import { Selection } from './Selection'
import { NormalizeDirective, NormalizeOperation } from './DeltaDiffComputer'
import DocumentDelta from './DocumentDelta'
import { DeltaBuffer } from './DeltaBuffer'
import { getHeadingCharactersFromType, isLineTypeTextLengthModifier } from './lines'
import Delta from 'quill-delta'
import { isMutatingDelta } from './generic'

/**
 * This class encapsulate the information necessary to perform
 * a graphic update.
 */
export class DocumentDeltaUpdate {
  public readonly nextDocumentDelta: DocumentDelta
  private _overridingSelection: Selection|null
  private _normalizedDelta: DocumentDelta

  constructor(nextDocumentDelta: DocumentDelta, normalizationDirectives: NormalizeDirective[] = [], overridingSelection?: Selection) {
    const mustComputeNormalization = normalizationDirectives.length > 0
    this.nextDocumentDelta = nextDocumentDelta
    const { overridingSelection: normalizeOverridingSelection, delta } = mustComputeNormalization ? this.normalize(normalizationDirectives) : { delta: nextDocumentDelta, overridingSelection: null }
    this._overridingSelection = overridingSelection || normalizeOverridingSelection || null
    this._normalizedDelta = delta
  }

  private normalize(directives: NormalizeDirective[]): { delta: DocumentDelta, overridingSelection: Selection|null } {
    const diffBuffer = new DeltaBuffer()
    let overridingSelection: Selection|null = null
    this.nextDocumentDelta.eachLine((line) => {
      const { lineType, lineTypeIndex, beginningOfLineIndex } = line
      const requiredPrefix = getHeadingCharactersFromType(lineType, lineTypeIndex)
      let numToDelete = 0
      let numToRetainInPrefix = 0
      let lineAttributes = {}
      let charsToInsert = ''
      directives.forEach((directive) => {
        const { beginningOfLineIndex: directiveIndex } = directive
        const { selectionAfterChange } = directive.context
        const matchingLine = directiveIndex === beginningOfLineIndex
        const relativeCursorPosition = selectionAfterChange.start - beginningOfLineIndex
        const shouldInvestigatePrefix = matchingLine &&
                                        directive.type === NormalizeOperation.CHECK_LINE_TYPE_PREFIX
        const shouldApplyInsertion = matchingLine &&
                                     directive.type === NormalizeOperation.INSERT_LINE_TYPE_PREFIX
        const shouldApplyDeletion = matchingLine &&
                                    directive.type === NormalizeOperation.INVESTIGATE_DELETION &&
                                    relativeCursorPosition <= requiredPrefix.length &&
                                    isLineTypeTextLengthModifier(line.lineType)
        if (shouldApplyInsertion) {
          charsToInsert = requiredPrefix
        } else if (shouldApplyDeletion) {
          const deleteTraversal = directive.context.deleteTraversal()
          const prefixTraversal = Selection.fromBounds(line.beginningOfLineIndex, line.beginningOfLineIndex + requiredPrefix.length)
          const alreadyDeletedChars = prefixTraversal.intersection(deleteTraversal).length()
          numToDelete = requiredPrefix.length - alreadyDeletedChars
          lineAttributes = { $type: null }
          overridingSelection = Selection.fromBounds(line.beginningOfLineIndex)
        } else if (shouldInvestigatePrefix && directive.diff) {
          const lineDiff = directive.diff.slice(0, requiredPrefix.length)
          if (isMutatingDelta(lineDiff)) {
            const iterator = Delta.Op.iterator(lineDiff.ops)
            let index = 0
            while (iterator.hasNext()) {
              const next = iterator.next()
              if (next.retain) {
                numToRetainInPrefix = next.retain
                index += next.retain
              } else if (typeof next.insert === 'string') {
                const numToInsert = requiredPrefix.length - index
                charsToInsert += requiredPrefix.slice(index, index + numToInsert)
                index += numToInsert
                break
              }
            }
            overridingSelection = Selection.fromBounds(selectionAfterChange.start + charsToInsert.length - numToDelete)
          }
        }
      })
      diffBuffer.push(new Delta()
        .retain(numToRetainInPrefix)
        .delete(numToDelete)
        .insert(charsToInsert)
        .retain(line.delta.length() - numToDelete - numToRetainInPrefix)
        .retain(1, lineAttributes))
    })
    const diff = diffBuffer.compose()
    return {
      overridingSelection,
      delta: isMutatingDelta(diff) ? this.nextDocumentDelta.compose(diff) : this.nextDocumentDelta
    }
  }

  public get normalizedDelta(): DocumentDelta {
    return this._normalizedDelta
  }

  public get overridingSelection(): Selection|null {
    return this._overridingSelection
  }

  public getSelectedTextAttributes(selection: Selection) {
    return this.normalizedDelta.getSelectedTextAttributes(selection)
  }

  public getLineTypeInSelection(selection: Selection) {
    return this.normalizedDelta.getLineTypeInSelection(selection)
  }

  public shouldApplyNormalization() {
    return this.normalizedDelta !== this.nextDocumentDelta
  }
}
