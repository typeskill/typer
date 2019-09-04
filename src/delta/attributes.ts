import mergeAll from 'ramda/es/mergeAll'
import reject from 'ramda/es/reject'
import isNil from 'ramda/es/isNil'
import omit from 'ramda/es/omit'

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

const rejectNil = reject(isNil)

/**
 * Create a new object with the own properties of the first object merged with the own properties of the second object and so on.
 * If a key exists in both objects, the value from the endmost object will be used.
 *
 * @remarks
 *
 * `null` values are removed from the returned object.
 *
 * @param attributes - the attributes object to merge
 */
export function mergeAttributesRight(...attributes: Attributes.Map[]): Attributes.Map {
  return rejectNil(mergeAll<Attributes.Map>(attributes))
}

export const getTextAttributes = omit(['$type'])
