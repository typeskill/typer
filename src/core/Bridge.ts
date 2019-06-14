import { BlockAttributeValue, BlockAttributesMap } from '@delta/attributes'
import { defaultTextTransforms, TextTransformSpec } from '@core/transforms'
import { TextLineType } from '@delta/lines'
import { Endpoint } from './Endpoint'
import { TextTransformsRegistry } from './TextTransformsRegistry'

/**
 * A set of definitions related to the {@link Bridge:class} class.
 *
 * @public
 */
declare namespace Bridge {
  /**
   * An event external to the {@link Sheet:class}.
   */
  export type OuterEvent =
    | 'APPLY_ATTRIBUTES_TO_SELECTION'
    | 'APPLY_LINE_TYPE_TO_SELECTION'
    | 'INSERT_OR_REPLACE_AT_SELECTION'

  /**
   * An event internal to the {@link Sheet:class}.
   */
  export type InnerEvent = 'SELECTED_ATTRIBUTES_CHANGE' | 'SELECTED_LINE_TYPE_CHANGE'

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
  export type SelectedAttributesChangeListener = (selectedAttributes: BlockAttributesMap) => void

  /**
   * Listener to attribute override.
   *
   * @internal
   */
  export type AttributesOverrideListener = (attributeName: string, attributeValue: BlockAttributeValue) => void

  /**
   * Listener to line type override.
   *
   * @internal
   */
  export type LineTypeOverrideListener = (lineType: TextLineType) => void

  /**
   *
   * @internal
   */
  export type InsertOrReplaceAtSelectionListener = (element: Element) => void

  /**
   * An object to react from and dispatch to internal events.
   */
  export interface OuterInterface {
    /**
     * Insert an element at cursor or replace if selection exists.
     */
    insertOrReplaceAtSelection: (element: Element) => void

    /**
     * Switch the given attribute's value depending on the current selection.
     *
     * @remarks
     *
     * - if **all characters** traversed by selection have the `attributeName` set to `attributeValue`, **clear** this attribute for all characters in this selection
     * - otherwise set `attributeName`  to `attributeValue` for all characters traversed by this selection
     */
    applyTextTransformToSelection: (attributeName: string, attributeValue: BlockAttributeValue) => void

    /**
     * Switch the line type of lines traversed by selection depending on its state.
     *
     * @remarks
     *
     * - if **all lines** traversed by selection are of the type `lineType`, set the type for each of those lines to `'normal'`
     * - otherwise, set the type of each of those lines to `lineType`
     *
     * @param lineType The type to apply
     */
    applyLineTransformToSelection: (lineType: TextLineType) => void

    /**
     * Listen to attributes changes in selection.
     */
    addSelectedAttributesChangeListener: (owner: object, listener: SelectedAttributesChangeListener) => void

    /**
     * Listen to line type changes in selection.
     */
    addSelectedLineTypeChangeListener: (owner: object, listener: LineTypeOverrideListener) => void
    /**
     * Remove all listeners registered for this owner
     */
    release: (owner: object) => void
  }

  /**
   * An object to react from and dispatch to external events.
   *
   * @remarks
   *
   * This controller should be used exclusively by the {@link Sheet:class} component.
   *
   * @internal
   */
  export interface InnerInterface {
    /**
     * Listen to text attributes alterations in selection.
     */
    addApplyTextTransformToSelectionListener: (owner: object, listener: AttributesOverrideListener) => void

    /**
     * Listen to type changes in selection
     */
    addApplyLineTypeToSelectionListener: (owner: object, listener: LineTypeOverrideListener) => void

    /**
     * Listen to insertions of text or blocks at selection.
     */
    addInsertOrReplaceAtSelectionListener: (owner: object, listener: InsertOrReplaceAtSelectionListener) => void

    /**
     * Set selected text attributes
     */
    setSelectedTextAttributes: (attributes: BlockAttributesMap) => void

    /**
     * Set line type in selection
     */
    setSelectedLineType: (lineType: TextLineType) => void
    /**
     * Remove all listeners registered for this owner
     */
    release: (owner: object) => void

    getTextTransformsReg(): TextTransformsRegistry
  }
}

/**
 * An abstraction responsible for event dispatching between the {@link Sheet:class} and external controls.
 *
 * @internalRemarks
 *
 * The implemententation is isolated and decoupled from the {@link Sheet:class} class.
 *
 * @public
 */
class Bridge {
  private innerEndpoint = new Endpoint<Bridge.InnerEvent>()
  private outerEndpoint = new Endpoint<Bridge.OuterEvent>()
  private textTransformsReg: TextTransformsRegistry

  private outerInterface: Bridge.OuterInterface = Object.freeze({
    insertOrReplaceAtSelection: (element: string | Bridge.Block) => {
      this.outerEndpoint.emit('INSERT_OR_REPLACE_AT_SELECTION', element)
    },
    applyTextTransformToSelection: (attributeName: string, attributeValue: BlockAttributeValue) => {
      this.outerEndpoint.emit('APPLY_ATTRIBUTES_TO_SELECTION', attributeName, attributeValue)
    },
    applyLineTransformToSelection: (lineType: TextLineType) => {
      this.outerEndpoint.emit('APPLY_LINE_TYPE_TO_SELECTION', lineType)
    },
    addSelectedAttributesChangeListener: (owner: object, listener: Bridge.SelectedAttributesChangeListener) => {
      this.innerEndpoint.addListener(owner, 'SELECTED_ATTRIBUTES_CHANGE', listener)
    },
    addSelectedLineTypeChangeListener: (owner: object, listener: Bridge.LineTypeOverrideListener) => {
      this.innerEndpoint.addListener(owner, 'SELECTED_LINE_TYPE_CHANGE', listener)
    },
    release: (owner: object) => {
      this.innerEndpoint.release(owner)
    },
  })

  private innerInterface: Bridge.InnerInterface = Object.freeze({
    addApplyTextTransformToSelectionListener: (owner: object, listener: Bridge.AttributesOverrideListener) => {
      this.outerEndpoint.addListener(owner, 'APPLY_ATTRIBUTES_TO_SELECTION', listener)
    },
    addApplyLineTypeToSelectionListener: (owner: object, listener: Bridge.LineTypeOverrideListener) => {
      this.outerEndpoint.addListener(owner, 'APPLY_LINE_TYPE_TO_SELECTION', listener)
    },
    addInsertOrReplaceAtSelectionListener: (owner: object, listener: Bridge.InsertOrReplaceAtSelectionListener) => {
      this.outerEndpoint.addListener(owner, 'INSERT_OR_REPLACE_AT_SELECTION', listener)
    },
    setSelectedTextAttributes: (attributes: BlockAttributesMap) => {
      this.innerEndpoint.emit('SELECTED_ATTRIBUTES_CHANGE', attributes)
    },
    setSelectedLineType: (lineType: TextLineType) => {
      this.innerEndpoint.emit('SELECTED_LINE_TYPE_CHANGE', lineType)
    },
    release: (owner: object) => {
      this.outerEndpoint.release(owner)
    },
    getTextTransformsReg: () => this.textTransformsReg,
  })

  /**
   *
   * @param textTransformSpecs A list of TextTransformsSpecs which will be used to map text attributes with styles.
   */
  public constructor(textTransformSpecs?: TextTransformSpec[]) {
    this.textTransformsReg = new TextTransformsRegistry(textTransformSpecs || defaultTextTransforms)
  }

  /**
   * Get this bridge {@link Bridge:namespace.InnerInterface | innerInterface}.
   *
   * @internal
   */
  public getInnerInterface(): Bridge.InnerInterface {
    return this.innerInterface
  }

  /**
   * Get this bridge {@link Bridge:namespace.InnerInterface | outerInterface}.
   *
   * @remarks
   *
   * The returned object can be used to react from and trigger {@link Sheet:class} events.
   */
  public getOuterInterface(): Bridge.OuterInterface {
    return this.outerInterface
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
