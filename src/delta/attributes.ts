export interface BlockAttributesMap {
  [k: string]: any
}

export type TextAttributesMap<T extends string> = Partial<{
  [key in T]: any
}>
