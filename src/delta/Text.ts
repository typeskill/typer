import { Selection } from './Selection'
import { GenericLine } from './lines'

export interface TextLine extends GenericLine {
  text: string
}

/**
 * Intermediary entity between pure text and {@link quill-delta#Delta the Delta class}.
 *
 * @remarks
 *
 * A Text instance represents an absolute-positionned part of the document.
 * We refer to absolute coordinates as **Document coordinates** or index, and relative
 * coordinates as **Text coordiantes** or index.
 */
export class Text {
  public readonly raw: string
  public readonly beginningIndex: number = 0

  public constructor(rawText: string, beginningIndex?: number) {
    this.raw = rawText
    this.beginningIndex = beginningIndex || 0
  }

  private documentToTextIndex(documentIndex: number) {
    return documentIndex - this.beginningIndex
  }

  private textToDocumentIndex(textIndex: number) {
    return textIndex + this.beginningIndex
  }

  public get length() {
    return this.raw.length
  }

  /**
   *
   * @param from Document index of the first character to select.
   * @param to Document index of the last + 1 character to select.
   */
  public substring(from: number, to: number): string {
    return this.raw.substring(this.documentToTextIndex(from), this.documentToTextIndex(to))
  }

  /**
   *
   * @param documentIndex
   */
  public charAt(documentIndex: number): string {
    return this.raw.charAt(this.documentToTextIndex(documentIndex))
  }

  /**
   *
   * @param documentSelection Document coordinates of selection.
   * @returns A new {@link Text} instance which is a substring of `this` instance with Document coordiantes.
   */
  public select(documentSelection: Selection): Text {
    return new Text(this.substring(documentSelection.start, documentSelection.end), documentSelection.start)
  }

  /**
   * Builds the selection matching lines touched by the param `selection`.
   *
   * @remarks
   *
   * For N characters, there are N+1 selection indexes. In the example bellow,
   * each character is surrounded by two cursor positions reprented with crosses (`†`).
   *
   * `†A†B†\n†C†D†\n†`
   *
   * **Encompassing**
   *
   * The selection encompassing a line always excludes the index referring to the end of the
   * trailing newline character.
   * In the example above, the selection `[1, 2]` would match this line: `[0, 2]` with characters `'AB'`.
   * The selection `[4, 5]` would match the line `[3, 5]` with characters `'CD'`.
   *
   * **Multiple lines**
   *
   * When multiple lines are touched by the param `selection`, indexes referring
   * to the end of the trailing newline character in sibling lines are included.
   *
   * Therefore, in the above example, applying the selection `[2, 3]` to this function
   * would result in the following selection: `[0, 5]`.
   *
   * @param documentSelection Document relative selection to which this algorithm apply.
   */
  public getSelectionEncompassingLines(documentSelection: Selection): Selection {
    let textStart = documentSelection.start - this.beginningIndex
    let textEnd = documentSelection.end - this.beginningIndex
    while (textStart > 0 && this.raw.charAt(textStart - 1) !== '\n') {
      textStart -= 1
    }
    while (textEnd < this.raw.length && this.raw.charAt(textEnd) !== '\n') {
      textEnd += 1
    }
    return Selection.fromBounds(this.textToDocumentIndex(textStart), this.textToDocumentIndex(textEnd))
  }

  /**
   * @returns A list of lines complying with the {@link GenericLine} contract.
   */
  public getLines(): TextLine[] {
    let charIndex = this.beginningIndex - 1
    let lineIndex = -1
    const lines = this.raw.split('\n')
    return lines.map(text => {
      const start = charIndex + 1
      charIndex = start + text.length
      lineIndex += 1
      const lineRange = Selection.fromBounds(start, charIndex)
      return {
        text,
        lineRange,
        index: lineIndex,
      }
    })
  }
}
