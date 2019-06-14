import prop from 'ramda/es/prop'
import groupBy from 'ramda/es/groupBy'
import { StyleProp, TextStyle } from 'react-native'
import invariant from 'invariant'
import { BaseTextTransformAttribute, TextTransformsDictionnary, TextTransformSpec } from '@core/transforms'
import { TextOp } from '@delta/operations'

const attributeNameGetter = prop('attributeName') as (t: TextTransformSpec<any, any>) => string

export function textTransformListToDict<T extends string = BaseTextTransformAttribute>(
  list: TextTransformSpec<T, any>[],
): TextTransformsDictionnary<T> {
  return groupBy(attributeNameGetter)(list)
}

export class TextTransformsRegistry<T extends string = BaseTextTransformAttribute> {
  private textTransformsDict: TextTransformsDictionnary<T>

  public constructor(textTransformSpecs: TextTransformSpec<T, any>[]) {
    this.textTransformsDict = textTransformListToDict(textTransformSpecs)
  }

  public getStylesFromOp(op: TextOp<T>): StyleProp<TextStyle> {
    const styles: StyleProp<TextStyle> = []
    if (op.attributes) {
      for (const attributeName of Object.keys(op.attributes)) {
        if (op.attributes != null && attributeName !== '$type') {
          const attributeValue = op.attributes[attributeName as T]
          let match = false
          if (attributeValue !== null) {
            for (const candidate of this.textTransformsDict[attributeName as T] || []) {
              if (candidate.attributeValue === attributeValue) {
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
