import { TextStyle } from 'react-native'

type TextAttributePrimitive = boolean | string

export type BaseTextTransformAttribute = 'bold' | 'italic' | 'textDecoration'

export const booleanTransformBase = {
  attributeValue: true as true
}

export type TextTransformsDictionnary<T extends string = BaseTextTransformAttribute> = {
  [attributeName in T]: TextTransformSpec<T, any>[]
}

export interface TextTransformSpec<T extends string, A extends TextAttributePrimitive> {
  attributeName: T
  attributeValue: A
  activeStyle: TextStyle
}

export type BooleanTextTransformSpec<T extends string> = TextTransformSpec<T, true>

export const boldTransform: BooleanTextTransformSpec<'bold'> = {
  ...booleanTransformBase,
  attributeName: 'bold',
  activeStyle: {
    fontWeight: 'bold'
  }
}

export const italicTransform: BooleanTextTransformSpec<'italic'> = {
  ...booleanTransformBase,
  attributeName: 'italic',
  activeStyle: {
    fontStyle: 'italic'
  }
}

export const underlineTransform: TextTransformSpec<'textDecoration', 'underline'> = {
  attributeValue: 'underline',
  attributeName: 'textDecoration',
  activeStyle: {
    textDecorationStyle: 'solid',
    textDecorationLine: 'underline'
  }
}

export const strikethroughTransform: TextTransformSpec<'textDecoration', 'strikethrough'> = {
  attributeValue: 'strikethrough',
  attributeName: 'textDecoration',
  activeStyle: {
    textDecorationStyle: 'solid',
    textDecorationLine: 'line-through'
  }
}

export const defaultTextTransforms: TextTransformSpec<BaseTextTransformAttribute, any>[] = [
  boldTransform,
  italicTransform,
  underlineTransform,
  strikethroughTransform
]
