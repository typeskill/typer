import mergeAll from 'ramda/es/mergeAll'
import reject from 'ramda/es/reject'
import isNil from 'ramda/es/isNil'

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
