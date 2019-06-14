import { BlockAttributesMap } from './attributes'

interface OpBase {
  delete?: number
  retain?: number
}

export interface GenericOp extends OpBase {
  insert?: string | object
  attributes?: BlockAttributesMap
}

export interface TextOp extends OpBase {
  insert?: string
  attributes?: BlockAttributesMap
}

export interface BlockOp<T extends object> extends OpBase {
  insert?: T
  attributes?: BlockAttributesMap
}

export function isTextOp(op: GenericOp): op is TextOp {
  return typeof op.insert === 'string'
}
