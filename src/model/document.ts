/* eslint-disable @typescript-eslint/no-explicit-any */
import { Attributes } from '@delta/attributes'
import { SelectionShape } from '@delta/Selection'
import { GenericOp } from '@delta/operations'

/**
 * A serializable object representing the content of a Sheet.
 *
 * @public
 */
export interface DocumentContent {
  ops: GenericOp[]
  currentSelection: SelectionShape
  textAttributesAtCursor: Attributes.Map
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
