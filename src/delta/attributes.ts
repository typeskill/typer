import Delta from 'quill-delta'
import mergeAll from 'ramda/es/mergeAll'
import reject from 'ramda/es/reject'
import isNil from 'ramda/es/isNil'
import { GenericOp } from './operations'
import find from 'ramda/es/find'
import omit from 'ramda/es/omit'
import { GenericRichContent } from './generic'

/**
 * A set of definitions for {@link GenericOp} attributes.
 *
 * @public
 */
export declare namespace Attributes {
  /**
   * Possible values for a text transform.
   *
   * @public
   */
  export type TextValue = boolean | string | number | null

  /**
   * An attribute value.
   *
   * @public
   */
  export type GenericValue = object | TextValue | undefined

  /**
   * A set of attributes applying to a {@link GenericOp}.
   *
   * @public
   */
  export interface Map {
    readonly [k: string]: GenericValue
  }

  /**
   * A special text attribute value applied to a whole line.
   *
   * @remarks
   *
   * There can be only one text line type attribute active at once.
   *
   * @public
   */
  export type LineType = 'normal' | 'quoted'
}

/**
 * Recursively merge objects from right to left.
 *
 * @remarks
 *
 * `null` values are removed from the returned object.
 *
 * @param attributes - the attributes object to merge
 */
export function mergeAttributesLeft(...attributes: Attributes.Map[]): Attributes.Map {
  return reject(isNil)(mergeAll<Attributes.Map>(attributes))
}

export const getTextAttributes = omit(['$type'])

/**
 * This function returns attributes of the closest character before cursor.
 *
 * @param delta The full rich text representation
 * @param cursorPosition
 */
export function getTextAttributesAtCursor(delta: GenericRichContent, cursorPosition: number): Attributes.Map {
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
