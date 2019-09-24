import { Attributes } from '@delta/attributes'
import { Endpoint } from './Endpoint'
import { Images } from './Images'

/**
 * A set of definitions related to the {@link (Bridge:interface)} interface.
 *
 * @public
 */
declare namespace Bridge {
  /**
   * An event which signals the intent to modify the content touched by current selection.
   */
  export type ControlEvent = 'APPLY_ATTRIBUTES_TO_SELECTION' | 'INSERT_OR_REPLACE_AT_SELECTION'

  /**
   * Block content to insert.
   */
  export interface ImageElement<Source> {
    type: 'image'
    description: Images.Description<Source>
  }

  export interface TextElement {
    type: 'text'
    content: string
  }

  /**
   * Content to insert.
   */
  export type Element<ImageSource> = ImageElement<ImageSource> | TextElement

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
  export type InsertOrReplaceAtSelectionListener<ImageSource> = <D extends {}>(element: Element<ImageSource>) => void

  /**
   * An object representing an area of events happening by the mean of external controls.
   *
   * @remarks
   *
   * This object exposes methods to trigger such events, and react to internal events.
   */
  export interface ControlEventDomain<ImageSource> {
    /**
     * Insert an element at cursor or replace if selection exists.
     *
     * @internal
     */
    insertOrReplaceAtSelection: (element: Element<ImageSource>) => void

    /**
     * Switch the given attribute's value depending on the current selection.
     *
     * @param attributeName - The name of the attribute to edit.
     * @param attributeValue - The value of the attribute to edit. Assigning `null` clears any former truthy value.
     */
    applyTextTransformToSelection: (attributeName: string, attributeValue: Attributes.TextValue) => void
  }

  /**
   * An object representing an area of events happening inside the {@link (Typer:class)}.
   *
   * @privateRemarks
   *
   * This object exposes methods to trigger such events, and react to external events.
   *
   * @internal
   */
  export interface SheetEventDomain<ImageSource> {
    /**
     * Listen to text attributes alterations in selection.
     */
    addApplyTextTransformToSelectionListener: (owner: object, listener: AttributesOverrideListener) => void

    /**
     * Listen to insertions of text or blocks at selection.
     */
    addInsertOrReplaceAtSelectionListener: (
      owner: object,
      listener: InsertOrReplaceAtSelectionListener<ImageSource>,
    ) => void

    /**
     * Dereference all listeners registered for this owner.
     */
    release: (owner: object) => void
  }
}

/**
 * An abstraction responsible for event dispatching between the {@link (Typer:class)} and external controls.
 *
 * @remarks It also provide a uniform access to custom rendering logic.
 *
 * @internalRemarks
 *
 * We are only exporting the type to force consumers to use the build function.
 *
 * @public
 */
interface Bridge<ImageSource> {
  /**
   * Get {@link (Bridge:namespace).SheetEventDomain | sheetEventDom}.
   *
   * @internal
   */
  getSheetEventDomain: () => Bridge.SheetEventDomain<ImageSource>
  /**
   * Get this bridge {@link (Bridge:namespace).ControlEventDomain}.
   *
   * @remarks
   *
   * The returned object can be used to react from and trigger {@link (Typer:class)} events.
   */
  getControlEventDomain: () => Bridge.ControlEventDomain<ImageSource>
  /**
   * End of the bridge's lifecycle.
   *
   * @remarks
   *
   * One would typically call this method during `componentWillUnmout` hook.
   */
  release: () => void
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Bridge<ImageSource> implements Bridge<any> {
  private outerEndpoint = new Endpoint<Bridge.ControlEvent>()

  private controlEventDom: Bridge.ControlEventDomain<ImageSource> = {
    insertOrReplaceAtSelection: (element: Bridge.Element<ImageSource>) => {
      this.outerEndpoint.emit('INSERT_OR_REPLACE_AT_SELECTION', element)
    },
    applyTextTransformToSelection: (attributeName: string, attributeValue: Attributes.GenericValue) => {
      this.outerEndpoint.emit('APPLY_ATTRIBUTES_TO_SELECTION', attributeName, attributeValue)
    },
  }

  private sheetEventDom: Bridge.SheetEventDomain<ImageSource> = {
    addApplyTextTransformToSelectionListener: (owner: object, listener: Bridge.AttributesOverrideListener) => {
      this.outerEndpoint.addListener(owner, 'APPLY_ATTRIBUTES_TO_SELECTION', listener)
    },
    addInsertOrReplaceAtSelectionListener: (
      owner: object,
      listener: Bridge.InsertOrReplaceAtSelectionListener<ImageSource>,
    ) => {
      this.outerEndpoint.addListener(owner, 'INSERT_OR_REPLACE_AT_SELECTION', listener)
    },
    release: (owner: object) => {
      this.outerEndpoint.release(owner)
    },
  }

  public constructor() {
    this.sheetEventDom = Object.freeze(this.sheetEventDom)
    this.controlEventDom = Object.freeze(this.controlEventDom)
  }

  public getSheetEventDomain(): Bridge.SheetEventDomain<ImageSource> {
    return this.sheetEventDom
  }

  public getControlEventDomain(): Bridge.ControlEventDomain<ImageSource> {
    return this.controlEventDom
  }

  /**
   * End of the bridge's lifecycle.
   *
   * @remarks
   *
   * One would typically call this method during `componentWillUnmout` hook.
   */
  public release() {
    this.outerEndpoint.removeAllListeners()
  }
}

/**
 * Build a bridge instance.
 *
 * @public
 */
function buildBridge<ImageSource>(): Bridge<ImageSource> {
  return new _Bridge<ImageSource>()
}

const BridgeStatic = _Bridge
const Bridge = {}

export { Bridge, buildBridge, BridgeStatic }
