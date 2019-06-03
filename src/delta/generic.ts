import { GenericOp } from './operations'

export interface GenericDelta {
  readonly ops: GenericOp[]
  readonly length: () => number
}

export function extractTextFromDelta(delta: GenericDelta): string {
  return delta.ops.reduce((acc: string, curr: GenericOp) => typeof curr.insert === 'string' ? acc + curr.insert : acc, '')
}
