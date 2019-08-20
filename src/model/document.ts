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
  readonly ops: GenericOp[]
  readonly currentSelection: SelectionShape
  readonly textAttributesAtCursor: Attributes.Map
}

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
  }
}
