import { TextAttributesMap } from './attributes'

export interface Selection {
  start: number
  end: number
}

export interface SelectionContext<T extends string> extends Selection {
  inputLength: number
  attributes: TextAttributesMap<T>
}
