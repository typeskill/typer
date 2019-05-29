import { TextAttributesMap } from '@delta/attributes'
import { defaultTextTransforms, TextTransformSpec, BaseTextTransformAttribute, TextLineType } from '@delta/transforms'
import { Endpoint } from './Endpoint'
import TextTransformsRegistry from './TextTransformsRegistry'

declare namespace Bridge {

  export type OuterEvent = 'APPLY_ATTRIBUTES_TO_SELECTION' | 'APPLY_LINE_TYPE_TO_SELECTION' | 'INSERT_OR_REPLACE_AT_SELECTION'

  export type InnerEvent = 'SELECTED_ATTRIBUTES_CHANGE' | 'SELECTED_LINE_TYPE_CHANGE'

  export interface Block {
    type: string
  }

  export type Element = Block | string

  export type SelectedAttributesChangeListener = (selectedAttributes: any) => void

  export type AttributesChangeListener<T extends string> = (attributeName: T, attributeValue: any) => void

  export type LineTypeChangeListener = (lineType: TextLineType) => void

  export type InsertOrReplaceAtSelectionListener = (element: Element) => void

  export interface OuterInterface<T extends string> {
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
    applyTextTransformToSelection: (attributeName: T, attributeValue: any) => void

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
    addSelectedLineTypeChangeListener: (owner: object, listener: LineTypeChangeListener) => void
    /**
     * Remove all listeners registered for this owner
     */
    release: (owner: object) => void
  }

  /**
   * This controller should be used exclusively by the Sheet component.
   */
  export interface InnerInterface<T extends string> {
    /**
     * Listen to text attributes alterations in selection.
     */
    addApplyTextTransformToSelectionListener: (owner: object, listener: AttributesChangeListener<T>) => void

    /**
     * Listen to type changes in selection
     */
    addApplyLineTypeToSelectionListener: (owner: object, listener: Bridge.LineTypeChangeListener) => void

    /**
     * Listen to insertions of text or blocks at selection.
     */
    addInsertOrReplaceAtSelectionListener: (owner: object, listener: InsertOrReplaceAtSelectionListener) => void

    /**
     * Set selected text attributes
     */
    setSelectedTextAttributes: (attributes: TextAttributesMap<T>) => void

    /**
     * Set line type in selection
     */
    setSelectedLineType: (lineType: TextLineType) => void
    /**
     * Remove all listeners registered for this owner
     */
    release: (owner: object) => void

    getTextTransformsReg(): TextTransformsRegistry<T>
  }

}

/**
 * The Bridge class is an abstraction responsible for communication between the editor and external controls.
 * 
 */
class Bridge<T extends string = BaseTextTransformAttribute> {

  private innerEndpoint = new Endpoint<Bridge.InnerEvent>()
  private outerEndpoint = new Endpoint<Bridge.OuterEvent>()
  private textTransformsReg: TextTransformsRegistry<T>

  private outerInterface: Bridge.OuterInterface<T> = Object.freeze({
    insertOrReplaceAtSelection: (element: string | Bridge.Block) => {
      this.outerEndpoint.emit('INSERT_OR_REPLACE_AT_SELECTION', element)
    },
    applyTextTransformToSelection: (attributeName: T, attributeValue: any) => {
      this.outerEndpoint.emit('APPLY_ATTRIBUTES_TO_SELECTION', attributeName, attributeValue)
    },
    applyLineTransformToSelection: (lineType: TextLineType) => {
      this.outerEndpoint.emit('APPLY_LINE_TYPE_TO_SELECTION', lineType)
    },
    addSelectedAttributesChangeListener: (owner: object, listener: Bridge.SelectedAttributesChangeListener) => {
      this.innerEndpoint.addListener(owner, 'SELECTED_ATTRIBUTES_CHANGE', listener)
    },
    addSelectedLineTypeChangeListener: (owner: object, listener: Bridge.LineTypeChangeListener) => {
      this.innerEndpoint.addListener(owner, 'SELECTED_LINE_TYPE_CHANGE', listener)
    },
    release: (owner: object) => {
      this.innerEndpoint.release(owner)
    }
  })
  private innerInterface: Bridge.InnerInterface<T> = Object.freeze({
    addApplyTextTransformToSelectionListener: (owner: object, listener: Bridge.AttributesChangeListener<T>) => {
      this.outerEndpoint.addListener(owner, 'APPLY_ATTRIBUTES_TO_SELECTION', listener)
    },
    addApplyLineTypeToSelectionListener: (owner: object, listener: Bridge.LineTypeChangeListener) => {
      this.outerEndpoint.addListener(owner, 'APPLY_LINE_TYPE_TO_SELECTION', listener)
    },
    addInsertOrReplaceAtSelectionListener: (owner: object, listener: Bridge.InsertOrReplaceAtSelectionListener) => {
      this.outerEndpoint.addListener(owner, 'INSERT_OR_REPLACE_AT_SELECTION', listener)
    },
    setSelectedTextAttributes: (attributes: TextAttributesMap<T>) => {
      this.innerEndpoint.emit('SELECTED_ATTRIBUTES_CHANGE', attributes)
    },
    setSelectedLineType: (lineType: TextLineType) => {
      this.innerEndpoint.emit('SELECTED_LINE_TYPE_CHANGE', lineType)
    },
    release: (owner: object) => {
      this.outerEndpoint.release(owner)
    },
    getTextTransformsReg: () => this.textTransformsReg
  })

  /**
   * 
   * @param textTransformSpecs A list of TextTransformsSpecs which will be used to map text attributes with styles.
   */
  constructor(textTransformSpecs?: TextTransformSpec<T, any>[]) {
    this.textTransformsReg = new TextTransformsRegistry(textTransformSpecs || defaultTextTransforms as TextTransformSpec<T, any>[])
  }

  public getInnerInterface(): Bridge.InnerInterface<T> {
    return this.innerInterface
  }

  public getOuterInterface(): Bridge.OuterInterface<T> {
    return this.outerInterface
  }

  /**
   * End of the bridge's lifecycle.
   */
  public release() {
    this.innerEndpoint.removeAllListeners()
    this.outerEndpoint.removeAllListeners()
  }
}

export default Bridge
