import prop from 'ramda/es/prop'
import groupBy from 'ramda/es/groupBy'
import { StyleProp, TextStyle } from 'react-native'
import invariant from 'invariant'
import { TextTransformsDictionnary, TextTransformSpec } from '@core/transforms'
import { TextOp } from '@delta/operations'

const attributeNameGetter = prop('attributeName') as (t: TextTransformSpec) => string

export function textTransformListToDict(list: TextTransformSpec[]): TextTransformsDictionnary {
  return groupBy(attributeNameGetter)(list)
}

export class TextTransformsRegistry {
  private textTransformsDict: TextTransformsDictionnary

  public constructor(textTransformSpecs: TextTransformSpec[]) {
    this.textTransformsDict = textTransformListToDict(textTransformSpecs)
  }

  public getStylesFromOp(op: TextOp): StyleProp<TextStyle> {
    const styles: StyleProp<TextStyle> = []
    if (op.attributes) {
      for (const attributeName of Object.keys(op.attributes)) {
        if (op.attributes != null && attributeName !== '$type') {
          const attributeValue = op.attributes[attributeName]
          let match = false
          if (attributeValue !== null) {
            for (const candidate of this.textTransformsDict[attributeName] || []) {
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
