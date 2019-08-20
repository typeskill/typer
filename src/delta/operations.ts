import { Attributes } from './attributes'
import Op from 'quill-delta/dist/Op'
import reduce from 'ramda/es/reduce'

/**
 * An atomic operation representing changes to a document.
 *
 * @remarks
 *
 * This interface is a redefinition of {@link quilljs-delta#Op}.
 *
 * @public
 */
export interface GenericOp {
  /**
   * A representation of inserted content.
   */
  readonly insert?: string | object
  /**
   * A delete operation.
   *
   * @internal
   */
  readonly delete?: number
  /**
   * A retain operation
   *
   * @internal
   */
  readonly retain?: number
  /**
   * A set of attributes describing properties of the content.
   */
  readonly attributes?: Attributes.Map
}

/**
 * An operation containing text.
 *
 * @public
 */
export interface TextOp extends GenericOp {
  /**
   * {@inheritdoc GenericOp.insert}
   */
  readonly insert?: string
  /**
   * {@inheritdoc GenericOp.attributes}
   */
  readonly attributes?: Attributes.Map
}

export type ImageOp = BlockOp<{ kind: 'image' }>

export interface BlockOp<T extends object> extends GenericOp {
  /**
   * {@inheritdoc GenericOp.insert}
   */
  readonly insert?: T
  /**
   * {@inheritdoc GenericOp.attributes}
   */
  readonly attributes?: Attributes.Map
}

export function isTextOp(op: GenericOp): op is TextOp {
  return typeof op.insert === 'string'
}

export const computeOpsLength = reduce((curr: number, prev: GenericOp) => Op.length(prev) + curr, 0 as number)

export function buildTextOp(text: string, attributes?: Attributes.Map) {
  return {
    insert: text,
    attributes,
  }
}

export function buildImageOp(attributes?: Attributes.Map): ImageOp {
  return {
    attributes,
    insert: {
      kind: 'image',
    },
  }
}
