import Delta from 'quill-delta'
import mergeAll from 'ramda/es/mergeAll'
import reject from 'ramda/es/reject'
import isNil from 'ramda/es/isNil'
import { GenericOp } from './operations'
import find from 'ramda/es/find'
import omit from 'ramda/es/omit'
import { GenericDelta } from './generic'

export type TextAttributePrimitive = boolean | string | number

export type BlockAttributeValue = object | TextAttributePrimitive | null | undefined
export interface BlockAttributesMap {
  [k: string]: BlockAttributeValue
}

/**
 * Recursively merge objects from right to left.
 *
 * @remarks
 *
 * `null` values are removed from the remaining object.
 *
 * @param attributes - the attributes object to merge
 */
export function mergeAttributesLeft(...attributes: BlockAttributesMap[]): BlockAttributesMap {
  return reject(isNil)(mergeAll<BlockAttributesMap>(attributes))
}

export const getTextAttributes = omit(['$type'])

/**
 * This function returns attributes of the closest character before cursor.
 *
 * @param delta The full rich text representation
 * @param cursorPosition
 */
export function getTextAttributesAtCursor(delta: GenericDelta, cursorPosition: number): BlockAttributesMap {
  let lowerBound = 0
  const matchedOp = find((op: GenericOp) => {
    const len = Delta.Op.length(op)
    const upperBound = len + lowerBound
    const match = cursorPosition <= upperBound && cursorPosition >= lowerBound
    lowerBound = upperBound
    return match
  })(delta.ops)
  if (!matchedOp) {
    return {}
  }
  return getTextAttributes(matchedOp.attributes) || {}
}
