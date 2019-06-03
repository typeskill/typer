import mergeAll from 'ramda/es/mergeAll'
import reject from 'ramda/es/reject'
import isNil from 'ramda/es/isNil'
import { GenericOp, getOperationLength } from './operations'
import find from 'ramda/es/find'
import omit from 'ramda/es/omit'
import { GenericDelta } from './generic'

export interface BlockAttributesMap {
  [k: string]: any
}

export type TextAttributesMap<T extends string> = Partial<{
  [key in T]: any
}>

/**
 * Merge object beginning with the rightmost argument.
 * 
 * @remarks
 * 
 * `null` values are removed from the remaining object.
 * 
 * @param attributes - the attributes object to merge
 */
export function mergeAttributesRight(...attributes: BlockAttributesMap[]): BlockAttributesMap {
  return reject(isNil)(mergeAll(attributes))
}

export const getTextAttributes = omit(['$type'])

/**
 * This function returns attributes of the closest character before cursor.
 * 
 * @param delta The full rich text representation
 * @param cursorPosition 
 */
export function getTextAttributesAtCursor<T extends string>(delta: GenericDelta, cursorPosition: number): TextAttributesMap<T> {
  let lowerBound = 0
  const matchedOp = find((op: GenericOp) => {
    const len = getOperationLength(op)
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
