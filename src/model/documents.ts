import { Attributes } from '@delta/attributes'
import { SelectionShape, Selection } from '@delta/Selection'
import { GenericOp } from '@delta/operations'
import clone from 'ramda/es/clone'
import { DocumentDelta } from '@delta/DocumentDelta'
import { mergeLeft } from 'ramda'

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
   * The attributes encompassed by {@link DocumentContent.currentSelection} or the attributes at cursor.
   * `null` values represent attributes to be removed.
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
    ops: [{ insert: '\n' }],
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
    selectedTextAttributes: content.selectedTextAttributes,
  }
}

export function applyTextTransformToSelection(
  attributeName: string,
  attributeValue: Attributes.GenericValue,
  documentContent: DocumentContent,
): Pick<DocumentContent, 'ops' | 'selectedTextAttributes'> {
  const { currentSelection, ops, selectedTextAttributes } = documentContent
  const delta = new DocumentDelta(ops)
  const selection = Selection.fromShape(currentSelection)
  // Apply transforms to selection range
  const userAttributes = { [attributeName]: attributeValue }
  const atomicUpdate = delta.applyTextTransformToSelection(selection, attributeName, attributeValue)
  const nextSelectedAttributes = mergeLeft(userAttributes, selectedTextAttributes)
  return {
    selectedTextAttributes: nextSelectedAttributes,
    ops: atomicUpdate.delta.ops,
  }
}
