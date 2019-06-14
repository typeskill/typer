import { GenericDelta, extractTextFromDelta } from '@delta/generic'
import { GenericOp } from '@delta/operations'

/**
 * An entity representing rich text content.
 */
export class RichContent implements GenericDelta {
  public readonly ops: GenericOp[]

  private constructor(ops: GenericOp[]) {
    this.ops = ops
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static inspectUnmarshalledOps(unmarshaleld: any) {
    if (!unmarshaleld || !Array.isArray(unmarshaleld)) {
      throw new TypeError(`The unmarshalled ${this.constructor.name} doesn't have the expected shape.`)
    }
  }

  public length() {
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
   * Serialize this instance to a JSON array of operations.
   *
   * @returns The serialized JSON array of operations.
   */
  public toJSON(): string {
    return JSON.stringify(this.ops)
  }

  /**
   * Creates an instance from a serialized JSON array of operations.
   *
   * @param serializedOperations - The serialized JSON array of operations
   * @throws {@link SyntaxError} if the `serialized` param is not valid JSON
   * @throws {@link TypeError} if the unmarshaleld object doesn't have the expected shape
   *
   * @returns The unmarshalled instance.
   */
  public static fromJSON(serializedOperations: string): RichContent {
    const ops = JSON.parse(serializedOperations)
    this.inspectUnmarshalledOps(ops)
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
