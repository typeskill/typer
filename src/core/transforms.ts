import { TextStyle } from 'react-native'
import { TextAttributePrimitive } from '@delta/attributes'

export type BaseTextTransformAttribute = 'bold' | 'italic' | 'textDecoration'

export const booleanTransformBase = {
  attributeValue: true as true,
}

export interface TextTransformsDictionnary {
  [attributeName: string]: TextTransformSpec[]
}

export interface TextTransformSpec<A extends TextAttributePrimitive = TextAttributePrimitive> {
  attributeName: string
  attributeValue: A
  activeStyle: TextStyle
}

export type BooleanTextTransformSpec = TextTransformSpec<true>

export const boldTransform: BooleanTextTransformSpec = {
  ...booleanTransformBase,
  attributeName: 'bold',
  activeStyle: {
    fontWeight: 'bold',
  },
}

export const italicTransform: BooleanTextTransformSpec = {
  ...booleanTransformBase,
  attributeName: 'italic',
  activeStyle: {
    fontStyle: 'italic',
  },
}

export const underlineTransform: TextTransformSpec<'underline'> = {
  attributeValue: 'underline',
  attributeName: 'textDecoration',
  activeStyle: {
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline',
  },
}

export const strikethroughTransform: TextTransformSpec<'strikethrough'> = {
  attributeValue: 'strikethrough',
  attributeName: 'textDecoration',
  activeStyle: {
    textDecorationStyle: 'solid',
    textDecorationLine: 'line-through',
  },
}

export const defaultTextTransforms: TextTransformSpec[] = [
  boldTransform,
  italicTransform,
  underlineTransform,
  strikethroughTransform,
]
