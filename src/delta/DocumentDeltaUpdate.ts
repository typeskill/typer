import { Selection } from './Selection'
import { NormalizeDirective } from './DeltaDiffComputer'
import { DocumentDelta } from './DocumentDelta'
import { DocumentDeltaNormalizer } from './DocumentDeltaNormalizer'

/**
 * This class encapsulate the information necessary to perform
 * a graphic update.
 */
export class DocumentDeltaUpdate {
  private _intermediaryDelta: DocumentDelta|null = null
  private _intermediaryOverridingSelection: Selection|null = null
  private _finalOverridingSelection: Selection|null = null
  private _finalDelta: DocumentDelta

  constructor(afterApplyTextDiffDelta: DocumentDelta, normalizationDirectives: NormalizeDirective[] = [], overridingSelection?: Selection) {
    const mustComputeNormalization = normalizationDirectives.length > 0
    const normalizer = new DocumentDeltaNormalizer(afterApplyTextDiffDelta)
    if (mustComputeNormalization) {
      const { overridingSelection: normalizeOverridingSelection, delta: normalizedDelta } = normalizer.apply(normalizationDirectives)
      if (normalizedDelta !== afterApplyTextDiffDelta) {
        this._intermediaryDelta = afterApplyTextDiffDelta
        this._intermediaryOverridingSelection = overridingSelection || null
        this._finalDelta = normalizedDelta
        this._finalOverridingSelection = normalizeOverridingSelection
      }
    }
    // @ts-ignore
    if (!this._finalDelta) {
      this._finalDelta = afterApplyTextDiffDelta
      this._finalOverridingSelection = overridingSelection || null
    }
  }

  public get intermediaryDelta(): DocumentDelta|null {
    return this._intermediaryDelta
  }

  public get finalDelta(): DocumentDelta {
    return this._finalDelta
  }

  public get finalOverridingSelection(): Selection|null {
    return this._finalOverridingSelection
  }

  public get intermediaryOverridingSelection(): Selection|null {
    return this._intermediaryOverridingSelection
  }

  public getSelectedTextAttributes(selection: Selection) {
    return this._finalDelta.getSelectedTextAttributes(selection)
  }

  public getLineTypeInSelection(selection: Selection) {
    return this._finalDelta.getLineTypeInSelection(selection)
  }

  public hasIntermediaryDelta() {
    return this._intermediaryDelta !== null
  }
}
