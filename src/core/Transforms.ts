import prop from 'ramda/es/prop'
import groupBy from 'ramda/es/groupBy'
import { StyleProp, TextStyle, ViewStyle } from 'react-native'
import invariant from 'invariant'
import { TextOp } from '@delta/operations'
import { Attributes } from '@delta/attributes'

const attributeNameGetter = prop('attributeName') as (
  t: Transforms.GenericSpec<Attributes.GenericValue, Transforms.TargetType>,
) => string

export function textTransformListToDict<A extends Attributes.GenericValue, T extends Transforms.TargetType>(
  list: Transforms.GenericSpec<A, T>[],
): Transforms.Dict<A, T> {
  return groupBy(attributeNameGetter)(list) as Transforms.Dict<A, T>
}

/**
 * A set of definitions related to text and arbitrary content transforms.
 *
 * @public
 */
declare namespace Transforms {
  /**
   * The target type of a transform.
   */
  export type TargetType = 'block' | 'text'
  /**
   * A {@link (Transforms:namespace).GenericSpec} which `attributeActiveValue` is `true`.
   *
   * @public
   */
  export type BoolSpec<T extends TargetType = 'block'> = GenericSpec<true, T>
  /**
   * A mapping of attribute names with their corresponding transformation description.
   *
   * @internal
   */
  export interface Dict<A extends Attributes.GenericValue, T extends TargetType> {
    [attributeName: string]: GenericSpec<A, T>[]
  }
  /**
   * Default text attributes names.
   *
   * @public
   */
  export type TextAttributeName = 'bold' | 'italic' | 'textDecoration'

  /**
   * Description of a generic transform.
   *
   * @public
   */
  export interface GenericSpec<A extends Attributes.GenericValue, T extends TargetType> {
    /**
     * The name of the attribute.
     *
     * @remarks
     *
     * Multiple {@link (Transforms:namespace).GenericSpec} can share the same `attributeName`.
     */
    attributeName: string
    /**
     * The value of the attribute when this transform is active.
     */
    activeAttributeValue: A
    /**
     * The style applied to the target block when this transform is active.
     */
    activeStyle: T extends 'block' ? ViewStyle : TextStyle
  }

  export type Specs<T extends 'text' | 'block' = 'text'> = GenericSpec<Attributes.TextValue, T>[]
}

/**
 * An entity which responsibility is to provide styles from text transforms.
 *
 * @public
 */
class Transforms {
  private textTransformsDict: Transforms.Dict<Attributes.TextValue, 'text'>

  public constructor(textTransformSpecs: Transforms.GenericSpec<Attributes.TextValue, 'text'>[]) {
    this.textTransformsDict = textTransformListToDict(textTransformSpecs)
  }

  /**
   * Produce react styles from a text operation.
   *
   * @param op - text op.
   *
   * @internal
   */
  public getStylesFromOp(op: TextOp): StyleProp<TextStyle> {
    const styles: StyleProp<TextStyle> = []
    if (op.attributes) {
      for (const attributeName of Object.keys(op.attributes)) {
        if (op.attributes != null && attributeName !== '$type') {
          const attributeValue = op.attributes[attributeName]
          let match = false
          if (attributeValue !== null) {
            for (const candidate of this.textTransformsDict[attributeName] || []) {
              if (candidate.activeAttributeValue === attributeValue) {
                styles.push(candidate.activeStyle)
                match = true
              }
            }
            invariant(
              match,
              `A Text Transform must be specified for attribute "${attributeName}" with value ${JSON.stringify(
                attributeValue,
              )}`,
            )
          }
        }
      }
    }
    return styles
  }
}

export { Transforms }

export const booleanTransformBase = {
  activeAttributeValue: true as true,
}

export const boldTransform: Transforms.BoolSpec<'text'> = {
  ...booleanTransformBase,
  attributeName: 'bold',
  activeStyle: {
    fontWeight: 'bold',
  },
}

export const italicTransform: Transforms.BoolSpec<'text'> = {
  ...booleanTransformBase,
  attributeName: 'italic',
  activeStyle: {
    fontStyle: 'italic',
  },
}

export const underlineTransform: Transforms.GenericSpec<'underline', 'text'> = {
  activeAttributeValue: 'underline',
  attributeName: 'textDecoration',
  activeStyle: {
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
  },
}

export const strikethroughTransform: Transforms.GenericSpec<'strikethrough', 'text'> = {
  activeAttributeValue: 'strikethrough',
  attributeName: 'textDecoration',
  activeStyle: {
    textDecorationStyle: 'solid',
    textDecorationLine: 'line-through',
  },
}

/**
 * @public
 */
export const defaultTextTransforms: Transforms.GenericSpec<Attributes.TextValue, 'text'>[] = [
  boldTransform,
  italicTransform,
  underlineTransform,
  strikethroughTransform,
]
