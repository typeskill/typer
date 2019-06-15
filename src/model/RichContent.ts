/* eslint-disable @typescript-eslint/no-explicit-any */
import { GenericRichContent, extractTextFromDelta } from '@delta/generic'
import { GenericOp } from '@delta/operations'

/**
 * An entity representing rich text content.
 *
 * @remarks
 *
 * The constructor is not meant to be directly invoked.
 * Instead, use {@link RichContent.fromJSON} or {@link RichContent.fromOps}.
 *
 * @public
 */
export class RichContent implements GenericRichContent {
  /**
   * {@inheritdoc GenericRichContent.ops}
   */
  public readonly ops: GenericOp[]

  private constructor(ops: GenericOp[]) {
    this.ops = ops
  }

  private static inspectUnmarshalled(unmarshaleld: any) {
    if (!unmarshaleld || typeof unmarshaleld !== 'object') {
      throw new TypeError(`The unmarshalled ${this.constructor.name} doesn't have the expected shape.`)
    }
    const ops = (unmarshaleld as Record<string, any>).ops
    if (!ops || !Array.isArray(ops)) {
      throw new TypeError(
        `The unmarshalled ${this.constructor.name} doesn't have the expected shape: Missing 'ops' property.`,
      )
    }
  }

  /**
   * {@inheritdoc GenericRichContent.length}
   */
  public length(): number {
    return this.ops.length
  }

  /**
   * Extract the raw text from its array of operations.
   *
   * @returns The underlying raw text.
   */
  public toText(): string {
    return extractTextFromDelta(this)
  }

  /**
   * Serialize this instance.
   *
   * @returns The serialized JSON object.
   */
  public toJSON(): string {
    return JSON.stringify({ ops: this.ops })
  }

  /**
   * Creates an instance from a serialized JSON array of operations.
   *
   * @remarks
   *
   * This method throws on multiple occasions:
   *
   * - `SyntaxError` when the `serialized` param is not valid JSON
   * - `TypeError` when the unmarshaleld object doesn't have the expected shape
   *
   * @param serializedContent - The serialized JSON reprenting rich content.
   *
   * @returns The unmarshalled instance.
   */
  public static fromJSON(serializedContent: string): RichContent {
    const ops = JSON.parse(serializedContent)
    this.inspectUnmarshalled(ops)
    return new RichContent(ops)
  }

  /**
   * Creates an instance from an array of operations.
   *
   * @param ops - The array of operations.
   *
   * @returns The resulting instance.
   */
  public static fromOps(ops: GenericOp[] = []) {
    return new RichContent(ops)
  }
}
