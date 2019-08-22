/* eslint-disable @typescript-eslint/no-explicit-any */
import { Attributes } from '@delta/attributes'
import { SelectionShape } from '@delta/Selection'
import { GenericOp } from '@delta/operations'
import clone from 'ramda/es/clone'

/**
 * A serializable object representing the content of a Sheet.
 *
 * @public
 */
export interface DocumentContent {
  /**
   * A list of operations as per deltajs definition.
   */
  readonly ops: GenericOp[]
  /**
   * A contiguous range of selectable items.
   */
  readonly currentSelection: SelectionShape
  /**
   * The attributes ...
   */
  readonly textAttributesAtCursor: Attributes.Map
  /**
   * The attributes encompassed by {@link DocumentContent.currentSelection}.
   */
  readonly selectedTextAttributes: Attributes.Map
}

/**
 * An async callback aimed at updating the document state.
 *
 * @param diffowContent - This partial state should be shallow-merged with current `documentContent`.
 *
 * @public
 */
export type DocumentContentUpdater = (diffowContent: Partial<DocumentContent>) => Promise<void>

/**
 * Build the initial document content.
 *
 * @public
 */
export function buildInitialDocContent(): DocumentContent {
  return {
    currentSelection: { start: 0, end: 0 },
    ops: [{ insert: '' }],
    textAttributesAtCursor: {},
    selectedTextAttributes: {},
  }
}

/**
 * Clone a peace of {@link DocumentContent | document content}.
 *
 * @param content - The content to clone
 *
 * @public
 */
export function cloneDocContent(content: DocumentContent): DocumentContent {
  return {
    ops: clone(content.ops),
    currentSelection: content.currentSelection,
    textAttributesAtCursor: content.textAttributesAtCursor,
    selectedTextAttributes: content.selectedTextAttributes,
  }
}
