import { Selection } from './Selection'
import { NormalizeDirective } from './DeltaDiffComputer'
import DocumentDelta from './DocumentDelta'
import { DocumentDeltaNormalizer } from './DocumentDeltaNormalizer'

/**
 * This class encapsulate the information necessary to perform
 * a graphic update.
 */
export class DocumentDeltaUpdate {
  private _nextDocumentDelta: DocumentDelta
  private _overridingSelection: Selection|null
  private _normalizedDelta: DocumentDelta

  constructor(nextDocumentDelta: DocumentDelta, normalizationDirectives: NormalizeDirective[] = [], overridingSelection?: Selection) {
    const mustComputeNormalization = normalizationDirectives.length > 0
    this._nextDocumentDelta = nextDocumentDelta
    const normalizer = new DocumentDeltaNormalizer(nextDocumentDelta)
    const { overridingSelection: normalizeOverridingSelection, delta } = mustComputeNormalization ? normalizer.apply(normalizationDirectives) : { delta: nextDocumentDelta, overridingSelection: null }
    this._overridingSelection = overridingSelection || normalizeOverridingSelection || null
    this._normalizedDelta = delta
  }

  public get nextDocumentDelta(): DocumentDelta {
    return this._nextDocumentDelta
  }

  public get normalizedDelta(): DocumentDelta {
    return this._normalizedDelta
  }

  public get overridingSelection(): Selection|null {
    return this._overridingSelection
  }

  public getSelectedTextAttributes(selection: Selection) {
    return this._normalizedDelta.getSelectedTextAttributes(selection)
  }

  public getLineTypeInSelection(selection: Selection) {
    return this._normalizedDelta.getLineTypeInSelection(selection)
  }

  public shouldApplyNormalization() {
    return this.normalizedDelta !== this.nextDocumentDelta
  }
}
