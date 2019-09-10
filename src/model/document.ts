import { Attributes } from '@delta/attributes'
import { SelectionShape, Selection } from '@delta/Selection'
import { GenericOp } from '@delta/operations'
import clone from 'ramda/es/clone'
import { DocumentDelta } from '@delta/DocumentDelta'
import mergeLeft from 'ramda/es/mergeLeft'

/**
 * A serializable object representing rich content.
 *
 * @public
 */
export interface Document {
  /**
   * A list of operations as per deltajs definition.
   */
  readonly ops: GenericOp[]
  /**
   * A contiguous range of selectable items.
   */
  readonly currentSelection: SelectionShape
  /**
   * The attributes encompassed by {@link Document.currentSelection} or the attributes at cursor.
   * `null` values represent attributes to be removed.
   */
  readonly selectedTextAttributes: Attributes.Map
  /**
   * The diff ops which were used to produce current ops by combining previous ops.
   */
  readonly lastDiff: GenericOp[]
}

/**
 * An async callback aimed at updating the document.
 *
 * @param nextDocument - The next document.
 *
 * @public
 */
export type DocumentUpdater = (nextDocument: Document) => Promise<void>

/**
 * Build an empty document.
 *
 * @public
 */
export function buildEmptyDocument(): Document {
  return {
    currentSelection: { start: 0, end: 0 },
    ops: [{ insert: '\n' }],
    selectedTextAttributes: {},
    lastDiff: [],
  }
}

/**
 * Clone a peace of {@link Document | document}.
 *
 * @param content - The content to clone
 *
 * @public
 */
export function cloneDocument(content: Document): Document {
  return {
    ops: clone(content.ops),
    currentSelection: content.currentSelection,
    selectedTextAttributes: content.selectedTextAttributes,
    lastDiff: content.lastDiff,
  }
}

export function applyTextTransformToSelection(
  attributeName: string,
  attributeValue: Attributes.GenericValue,
  document: Document,
): Pick<Document, 'ops' | 'selectedTextAttributes' | 'lastDiff'> {
  const { currentSelection, ops, selectedTextAttributes } = document
  const delta = new DocumentDelta(ops)
  const selection = Selection.fromShape(currentSelection)
  // Apply transforms to selection range
  const userAttributes = { [attributeName]: attributeValue }
  const atomicUpdate = delta.applyTextTransformToSelection(selection, attributeName, attributeValue)
  const nextSelectedAttributes = mergeLeft(userAttributes, selectedTextAttributes)
  return {
    selectedTextAttributes: nextSelectedAttributes,
    ops: atomicUpdate.delta.ops,
    lastDiff: atomicUpdate.diff.ops,
  }
}
