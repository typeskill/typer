import { Attributes } from '@delta/attributes'
import { defaultTextTransforms } from '@core/Transforms'
import { Endpoint } from './Endpoint'
import { Transforms } from './Transforms'

/**
 * A set of definitions related to the {@link (Bridge:class)} class.
 *
 * @public
 */
declare namespace Bridge {
  export interface Config {
    /**
     * A list of {@link (Transforms:namespace).GenericSpec | specs} which will be used to map text attributes with styles.
     */
    textTransformSpecs?: Transforms.GenericSpec<Attributes.TextValue, 'text'>[]
  }
  /**
   * An event which signals the intent to modify the content touched by current selection.
   */
  export type ControlEvent =
    | 'APPLY_ATTRIBUTES_TO_SELECTION'
    | 'APPLY_LINE_TYPE_TO_SELECTION'
    | 'INSERT_OR_REPLACE_AT_SELECTION'

  /**
   * An event which informs from selection changes resulting from interactions happening within the {@link (Sheet:type)} component.
   */
  export type SheetEvent = 'SELECTED_ATTRIBUTES_CHANGE' | 'SELECTED_LINE_TYPE_CHANGE'

  /**
   * Block content to insert.
   */
  export interface Block {
    type: string
  }

  /**
   * Content to insert.
   */
  export type Element = Block | string

  /**
   * Listener to selected text attributes changes.
   */
  export type SelectedAttributesChangeListener = (selectedAttributes: Attributes.Map) => void

  /**
   * Listener to attribute overrides.
   *
   */
  export type AttributesOverrideListener = (attributeName: string, attributeValue: Attributes.GenericValue) => void

  /**
   * Listener to line type overrides.
   *
   */
  export type LineTypeOverrideListener = (lineType: Attributes.LineType) => void

  /**
   *
   * @internal
   */
  export type InsertOrReplaceAtSelectionListener = (element: Element) => void

  /**
   * An object representing an area of events happening by the mean of external controls.
   *
   * @remarks
   *
   * This object exposes methods to trigger such events, and react to internal events.
   */
  export interface ControlEventDomain {
    /**
     * Insert an element at cursor or replace if selection exists.
     *
     * @internal
     */
    insertOrReplaceAtSelection: (element: Element) => void

    /**
     * Switch the given attribute's value depending on the current selection.
     *
     * @param attributeName - The name of the attribute to edit.
     * @param attributeValue - The value of the attribute to edit. Assigning `null` clears any former truthy value.
     */
    applyTextTransformToSelection: (attributeName: string, attributeValue: Attributes.TextValue) => void

    /**
     * Listen to attributes changes in selection.
     */
    addSelectedAttributesChangeListener: (owner: object, listener: SelectedAttributesChangeListener) => void

    /**
     * Dereference all listeners registered for this owner.
     */
    release: (owner: object) => void
  }

  /**
   * An object representing an area of events happening inside the {@link (Sheet:type)}.
   *
   * @privateRemarks
   *
   * This object exposes methods to trigger such events, and react to external events.
   *
   * @internal
   */
  export interface SheetEventDomain {
    /**
     * Listen to text attributes alterations in selection.
     */
    addApplyTextTransformToSelectionListener: (owner: object, listener: AttributesOverrideListener) => void

    /**
     * Listen to insertions of text or blocks at selection.
     */
    addInsertOrReplaceAtSelectionListener: (owner: object, listener: InsertOrReplaceAtSelectionListener) => void

    /**
     * Notify selected text attributes update.
     *
     */
    notifySelectedTextAttributesChange: (attributesMap: Attributes.Map) => void

    /**
     * Notify selected line type update.
     *
     */
    notifySelectedLineTypeChange: (selectionLineType: Attributes.LineType) => void

    /**
     * Dereference all listeners registered for this owner.
     */
    release: (owner: object) => void

    getTransforms(): Transforms
  }
}

/**
 * An abstraction responsible for event dispatching between the {@link (Sheet:type)} and external controls.
 *
 * @internalRemarks
 *
 * The implemententation is isolated and decoupled from the {@link (Sheet:type)} class.
 *
 * @public
 */
class Bridge {
  private innerEndpoint = new Endpoint<Bridge.SheetEvent>()
  private outerEndpoint = new Endpoint<Bridge.ControlEvent>()
  private transforms: Transforms

  private controlEventDom: Bridge.ControlEventDomain = {
    insertOrReplaceAtSelection: (element: string | Bridge.Block) => {
      this.outerEndpoint.emit('INSERT_OR_REPLACE_AT_SELECTION', element)
    },
    applyTextTransformToSelection: (attributeName: string, attributeValue: Attributes.GenericValue) => {
      this.outerEndpoint.emit('APPLY_ATTRIBUTES_TO_SELECTION', attributeName, attributeValue)
    },
    addSelectedAttributesChangeListener: (owner: object, listener: Bridge.SelectedAttributesChangeListener) => {
      this.innerEndpoint.addListener(owner, 'SELECTED_ATTRIBUTES_CHANGE', listener)
    },
    release: (owner: object) => {
      this.innerEndpoint.release(owner)
    },
  }

  private sheetEventDom: Bridge.SheetEventDomain = {
    addApplyTextTransformToSelectionListener: (owner: object, listener: Bridge.AttributesOverrideListener) => {
      this.outerEndpoint.addListener(owner, 'APPLY_ATTRIBUTES_TO_SELECTION', listener)
    },
    addInsertOrReplaceAtSelectionListener: (owner: object, listener: Bridge.InsertOrReplaceAtSelectionListener) => {
      this.outerEndpoint.addListener(owner, 'INSERT_OR_REPLACE_AT_SELECTION', listener)
    },
    notifySelectedTextAttributesChange: (attributes: Attributes.Map) => {
      this.innerEndpoint.emit('SELECTED_ATTRIBUTES_CHANGE', attributes)
    },
    notifySelectedLineTypeChange: (lineType: Attributes.LineType) => {
      this.innerEndpoint.emit('SELECTED_LINE_TYPE_CHANGE', lineType)
    },
    release: (owner: object) => {
      this.outerEndpoint.release(owner)
    },
    getTransforms: () => this.transforms,
  }

  /**
   *
   * @param config - An object to customize bridge behavior
   */
  public constructor(config: Bridge.Config) {
    const { textTransformSpecs } = config
    this.transforms = new Transforms(textTransformSpecs || defaultTextTransforms)
    this.sheetEventDom = Object.freeze(this.sheetEventDom)
    this.controlEventDom = Object.freeze(this.controlEventDom)
  }

  /**
   * Get {@link (Bridge:namespace).SheetEventDomain | sheetEventDom}.
   *
   * @internal
   */
  public getSheetEventDomain(): Bridge.SheetEventDomain {
    return this.sheetEventDom
  }

  /**
   * Get this bridge {@link (Bridge:namespace).ControlEventDomain}.
   *
   * @remarks
   *
   * The returned object can be used to react from and trigger {@link (Sheet:type)} events.
   */
  public getControlEventDomain(): Bridge.ControlEventDomain {
    return this.controlEventDom
  }

  /**
   * Get transforms.
   */
  public getTransforms(): Transforms {
    return this.transforms
  }

  /**
   * End of the bridge's lifecycle.
   *
   * @remarks
   *
   * One would typically call this method during `componentWillUnmout` hook.
   */
  public release() {
    this.innerEndpoint.removeAllListeners()
    this.outerEndpoint.removeAllListeners()
  }
}

export { Bridge }
