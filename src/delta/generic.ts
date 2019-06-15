import { GenericOp } from './operations'
import Delta from 'quill-delta'
import hasPath from 'ramda/es/hasPath'

/**
 * A generic interface for instances describing rich content.
 *
 * @public
 */
export interface GenericRichContent {
  /**
   * An array of operations.
   */
  readonly ops: GenericOp[]
  /**
   * @returns The length of the underlying rich text representation.
   * This length represents the number of cursor positions in the document.
   */
  readonly length: () => number
}

export function extractTextFromDelta(delta: GenericRichContent): string {
  return delta.ops.reduce(
    (acc: string, curr: GenericOp) => (typeof curr.insert === 'string' ? acc + curr.insert : acc),
    '',
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isGenericDelta(arg: any): arg is GenericRichContent {
  return arg && hasPath(['ops'], arg)
}

export function isMutatingDelta(delta: GenericRichContent): boolean {
  const iterator = Delta.Op.iterator(delta.ops)
  let shouldOverride = false
  while (iterator.hasNext()) {
    const next = iterator.next()
    if (!next.retain || next.attributes != null) {
      shouldOverride = true
      break
    }
  }
  return shouldOverride
}
