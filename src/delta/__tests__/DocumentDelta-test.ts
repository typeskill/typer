// tslint:disable: no-string-literal
import { Attributes } from '@delta/attributes'
import { Selection } from '@delta/Selection'
import { mockDeltaChangeContext, mockSelection } from '@test/delta'
import { GenericRichContent } from '@delta/generic'
import { isLineInSelection } from '@delta/lines'
import { mockDocumentDelta } from '@test/document'
import { LineWalker } from '@delta/LineWalker'

fdescribe('@delta/DocumentDelta', () => {
  // The idea is to expose operations on different kind of blocks
  // Giving support for text blocks, ordered and unordered lists, headings
  describe('eachLine', () => {
    it('should handle lines', () => {
      const textDelta = mockDocumentDelta([
        { insert: 'eheh' },
        { insert: '\n', attributes: { $type: 'misc' } },
        { insert: 'ahah' },
        { insert: '\n', attributes: { $type: 'rand' } },
        { insert: 'ohoh\n\n' },
      ])
      const lines: GenericRichContent[] = []
      const attributes: Attributes.Map[] = []
      textDelta['delta'].eachLine((l, a) => {
        attributes.push(a)
        lines.push(l)
      })
      expect(lines).toEqual([
        { ops: [{ insert: 'eheh' }] },
        { ops: [{ insert: 'ahah' }] },
        { ops: [{ insert: 'ohoh' }] },
        { ops: [] },
      ])
      expect(attributes).toEqual([{ $type: 'misc' }, { $type: 'rand' }, {}, {}])
    })
  })
  describe('applyTextDiff', () => {
    it('should reproduce a delete operation when one character was deleted', () => {
      const newText = 'Hello worl\n'
      const originalDelta = mockDocumentDelta([{ insert: 'Hello world\n' }])
      const changeContext = mockDeltaChangeContext(11, 10)
      const diff = originalDelta.applyTextDiff(newText, changeContext)
      const { delta } = diff
      expect(delta.ops).toEqual([{ insert: newText }])
    })
    it('should reproduce a delete operation when two or more characters were deleted', () => {
      const newText = 'Hello \n'
      const originalDelta = mockDocumentDelta([{ insert: 'Hello world\n' }])
      const changeContext = mockDeltaChangeContext(6, 6, 11)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: newText }])
    })
    it('should reproduce a delete operation when multiple lines were deleted', () => {
      const newText = 'A\nB\n'
      const originalDelta = mockDocumentDelta([{ insert: 'A\nBC\nD\n' }])
      const changeContext = mockDeltaChangeContext(3, 3, 6)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: 'A\nB\n' }])
    })
    it('should reproduce an insert operation when one character was inserted', () => {
      const newText = 'Hello world\n'
      const originalDelta = mockDocumentDelta([{ insert: 'Hello worl\n' }])
      const changeContext = mockDeltaChangeContext(10, 11)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops[0].insert).toBe(newText)
    })
    it('should reproduce an insert operation when two or more characters were inserted', () => {
      const newText = 'Hello world\n'
      const originalDelta = mockDocumentDelta([{ insert: 'Hello \n' }])
      const changeContext = mockDeltaChangeContext(6, 11)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: newText }])
    })
    it('should reproduce an insert operation when multiple lines were inserted', () => {
      const newText = 'Hello world\nFoo\nBar\n'
      const originalDelta = mockDocumentDelta([{ insert: 'Hello world\n' }])
      const changeContext = mockDeltaChangeContext(11, 19)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: newText }])
    })
    it('should reproduce a replace operation when one character was replaced', () => {
      const newText = 'Hello worlq\n'
      const originalDelta = mockDocumentDelta([{ insert: 'Hello world\n' }])
      const changeContext = mockDeltaChangeContext(10, 11, 11)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: newText }])
    })
    it('should reproduce a replace operation when two ore more characters were replaced', () => {
      const newText = 'Hello cat\n'
      const originalDelta = mockDocumentDelta([{ insert: 'Hello world\n' }])
      const changeContext = mockDeltaChangeContext(6, 9, 11)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: newText }])
    })
    it("should reproduce a replace operation when cursor didn't move, but the text was replaced on the same line as cursor", () => {
      // This would happen with keyboard suggestions
      const newText = 'Hello cat\n'
      const originalDelta = mockDocumentDelta([{ insert: 'Hello pet\n' }])
      const changeContext = mockDeltaChangeContext(9, 9)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: newText }])
    })
    it('should reproduce a replace operation when cursor moved, but the change occurred out of cursor boundaries, in the same line', () => {
      // This would happen with keyboard suggestions
      const newText = 'Hello petty\n'
      const originalDelta = mockDocumentDelta([{ insert: 'Hello cat\n' }])
      const changeContext = mockDeltaChangeContext(9, 11)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: newText }])
    })
    it('should not append a newline character to delta after inserting a character at the begening of a newline', () => {
      const newText = 'Hello world\nH\n'
      const changeContext = mockDeltaChangeContext(11, 12)
      const originalDelta = mockDocumentDelta([{ insert: 'Hello world\n' }])
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: 'Hello world\nH\n' }])
    })
    it('should keep text attributes when removing a line', () => {
      const originalDelta = mockDocumentDelta([
        { insert: '\n' },
        { insert: 'L', attributes: { bold: true } },
        { insert: '\n' },
      ])
      const newText = 'L\n'
      const changeContext = mockDeltaChangeContext(1, 0)
      const { delta, diff } = originalDelta.applyTextDiff(newText, changeContext)
      expect(diff.ops).toEqual([{ delete: 1 }, { retain: 2 }])
      expect(delta.ops).toEqual([{ insert: 'L', attributes: { bold: true } }, { insert: '\n' }])
    })
    it('should keep text attributes when inserting a line', () => {
      const originalDelta = mockDocumentDelta([
        { insert: '\n' },
        { insert: 'L', attributes: { bold: true } },
        { insert: '\n' },
      ])
      const newText = '\nL\n\n'
      const changeContext = mockDeltaChangeContext(2, 3)
      const { delta, diff } = originalDelta.applyTextDiff(newText, changeContext)
      expect(diff.ops).toEqual([{ retain: 2 }, { insert: '\n' }, { retain: 1 }])
      expect(delta.ops).toEqual([{ insert: '\n' }, { insert: 'L', attributes: { bold: true } }, { insert: '\n\n' }])
    })
    it('it should handle insertion of a newline character from the middle of a line', () => {
      const newText = 'Hello \nworld\n'
      const changeContext = mockDeltaChangeContext(6, 7)
      const originalDelta = mockDocumentDelta([{ insert: 'Hello world\n' }])
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: 'Hello \nworld\n' }])
    })
    it('should not remove newline character when reaching the beginning of a line', () => {
      const changeContext = mockDeltaChangeContext(3, 2)
      const newText = 'A\n\nC\n'
      const originalDelta = mockDocumentDelta([{ insert: 'A\nB\nC\n' }])
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: 'A\n\nC\n' }])
    })
    // These four tests are skipped because we removed line-wise logic, which couldn't properly
    // handle some edge-cases.
    xit('should keep the line type at selection start when reproducing a multiline replace operation', () => {
      const newText = 'A\n'
      const originalDelta = mockDocumentDelta([
        { insert: 'A' },
        { insert: '\n', attributes: { $type: 'custom' } },
        { insert: 'B\nC\n' },
      ])
      const changeContext = mockDeltaChangeContext(1, 1, 5)
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: 'A' }, { insert: '\n', attributes: { $type: 'custom' } }])
    })
    xit('should retain newline character after inserting a newline character to keep the current linetype, if that line type is not propagable', () => {
      const newText = 'Hello world\n'
      const changeContext = mockDeltaChangeContext(11, 12)
      const originalDelta = mockDocumentDelta([
        { insert: 'Hello world' },
        { insert: '\n', attributes: { $type: 'misc' } },
      ])
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([
        { insert: 'Hello world' },
        { insert: '\n', attributes: { $type: 'misc' } },
        { insert: '\n' },
      ])
    })
    xit('should not propagate the previous line type to the newline after replacing a newline character, if that line type is not propagable', () => {
      const newText = 'Hello worl\n'
      const changeContext = mockDeltaChangeContext(10, 11, 11)
      const originalDelta = mockDocumentDelta([
        { insert: 'Hello world' },
        { insert: '\n', attributes: { $type: 'misc' } },
      ])
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([
        { insert: 'Hello worl' },
        { insert: '\n', attributes: { $type: 'misc' } },
        { insert: '\n' },
      ])
    })
    xit('should retain first newline character and remove next newline when removing newline', () => {
      const changeContext = mockDeltaChangeContext(2, 1)
      const newText = 'A\nC\n'
      const originalDelta = mockDocumentDelta([
        { insert: 'A' },
        { insert: '\n', attributes: { $type: 'custom' } },
        { insert: '\nC\n' },
      ])
      const { delta } = originalDelta.applyTextDiff(newText, changeContext)
      expect(delta.ops).toEqual([{ insert: 'A' }, { insert: '\n', attributes: { $type: 'custom' } }, { insert: 'C\n' }])
    })
  })
  describe('applyTextTransformToSelection', () => {
    it('should clear attribute if its name and value are present in each operation of the selection', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test', attributes: { textDecoration: 'underline' } },
        { insert: 'test', attributes: { textDecoration: 'underline', bold: true } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection = Selection.fromShape({
        start: 6,
        end: 14,
      })
      const { delta: finalDelta } = delta.applyTextTransformToSelection(selection, 'textDecoration', 'underline')
      expect(finalDelta.ops).toEqual([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test' },
        { insert: 'test', attributes: { bold: true } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
    })
    it('should replace attribute if its name is present in each operation but its value is at least different once', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test', attributes: { textDecoration: 'underline' } },
        { insert: 'test', attributes: { textDecoration: 'strikethrough' } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection: Selection = Selection.fromShape({
        start: 6,
        end: 14,
      })
      const { delta: finalDelta } = delta.applyTextTransformToSelection(selection, 'textDecoration', 'underline')
      expect(finalDelta.ops).toEqual([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'testtest', attributes: { textDecoration: 'underline' } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
    })
    it('should assign attribute if it is absent at least in one operation of the selection', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test', attributes: { textDecoration: 'underline' } },
        { insert: 'test', attributes: {} },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection: Selection = Selection.fromShape({
        start: 6,
        end: 14,
      })
      const { delta: finalDelta } = delta.applyTextTransformToSelection(selection, 'textDecoration', 'underline')
      expect(finalDelta.ops).toEqual([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'testtest', attributes: { textDecoration: 'underline' } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
    })
    it('should assign attribute if it is absent at least in one operation of the selection and override other values', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test', attributes: { textDecoration: 'underline' } },
        { insert: 'test', attributes: { textDecoration: 'strikethrough' } },
        { insert: 'test', attributes: {} },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection: Selection = Selection.fromShape({
        start: 6,
        end: 18,
      })
      const { delta: finalDelta } = delta.applyTextTransformToSelection(selection, 'textDecoration', 'underline')
      expect(finalDelta.ops).toEqual([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'testtesttest', attributes: { textDecoration: 'underline' } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
    })
  })
  describe('getSelectedTextAttributes', () => {
    it('should ignore attributes which are not present throughout the selection', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test', attributes: { bold: true } },
        { insert: 'test', attributes: { italic: true } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection: Selection = Selection.fromShape({
        start: 6,
        end: 14,
      })
      const attributes = delta.getSelectedTextAttributes(selection)
      expect(attributes).toEqual({})
    })
    it('should ignore nil attributes', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test', attributes: { bold: null } },
        { insert: 'test', attributes: { bold: undefined } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection: Selection = Selection.fromShape({
        start: 6,
        end: 14,
      })
      const attributes = delta.getSelectedTextAttributes(selection)
      expect(attributes).toEqual({})
    })
    it('should ignore empty attributes', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test', attributes: { bold: true } },
        { insert: 'test' },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection: Selection = Selection.fromShape({
        start: 6,
        end: 14,
      })
      const attributes = delta.getSelectedTextAttributes(selection)
      expect(attributes).toEqual({})
    })
    it('should discard values when a conflict occurs', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test', attributes: { textDecoration: 'underline' } },
        { insert: 'test', attributes: { textDecoration: 'strike' } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection: Selection = Selection.fromShape({
        start: 6,
        end: 14,
      })
      const attributes = delta.getSelectedTextAttributes(selection)
      expect(attributes).toEqual({})
    })
    it('should keep values present throughout the selection', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix', attributes: { untouched: true } },
        { insert: 'test', attributes: { textDecoration: 'strike', bold: true } },
        { insert: 'test', attributes: { textDecoration: 'strike' } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection: Selection = Selection.fromShape({
        start: 6,
        end: 14,
      })
      const attributes = delta.getSelectedTextAttributes(selection)
      expect(attributes).toEqual({ textDecoration: 'strike' })
    })
    it('should skip newlines', () => {
      const delta = mockDocumentDelta([
        { insert: 'prefix\n', attributes: { untouched: true } },
        { insert: 'test\ntest\n', attributes: { bold: true } },
        { insert: 'suffix', attributes: { untouched: true } },
      ])
      const selection: Selection = Selection.fromShape({
        start: 7,
        end: 17,
      })
      const attributes = delta.getSelectedTextAttributes(selection)
      expect(attributes).toEqual({ bold: true })
    })
  })
  describe('getSelectionEncompassingLines', () => {
    it('should encompass characters left to starting cursor', () => {
      const delta = mockDocumentDelta([{ insert: 'Hello\n' }])
      expect(delta['getSelectionEncompassingLines'](mockSelection(2, 6))).toEqual(mockSelection(0, 6))
    })
    it('should encompass characters right to ending cursor', () => {
      const delta = mockDocumentDelta([{ insert: 'Hello\n' }])
      expect(delta['getSelectionEncompassingLines'](mockSelection(0, 4))).toEqual(mockSelection(0, 6))
    })
    it('should not encompass lines outside cursor scope', () => {
      const delta = mockDocumentDelta([{ insert: 'All right\n' }, { insert: 'Hello\n' }, { insert: 'Felling good\n' }])
      expect(delta['getSelectionEncompassingLines'](mockSelection(10, 14))).toEqual(mockSelection(10, 16))
    })
  })
  describe('getLineTypeInSelection', () => {
    it('should return "normal" when all lines attributes are empty', () => {
      const delta = mockDocumentDelta([
        { insert: 'hi\n' },
        { insert: 'feeling great', attributes: { bold: true } },
        { insert: '\n' },
      ])
      expect(delta.getLineTypeInSelection(mockSelection(0, 18))).toEqual('normal')
    })
    it('should return "normal" when at least one line attributes is empty', () => {
      const delta = mockDocumentDelta([
        { insert: 'hi\n' },
        { insert: 'feeling great', attributes: { bold: true } },
        { insert: '\n', attributes: { $type: 'misc' } },
        { insert: 'Felling good' },
        { insert: '\n', attributes: { $type: 'rand' } },
      ])
      expect(delta.getLineTypeInSelection(mockSelection(0, 31))).toEqual('normal')
    })
    it('should return "misc" when all line types are "misc"', () => {
      const delta = mockDocumentDelta([
        { insert: 'hi' },
        { insert: '\n', attributes: { $type: 'misc' } },
        { insert: 'feeling great', attributes: { bold: true } },
        { insert: '\n', attributes: { $type: 'misc' } },
        { insert: 'Felling good' },
        { insert: '\n', attributes: { $type: 'misc' } },
      ])
      expect(delta.getLineTypeInSelection(mockSelection(0, 31))).toEqual('misc')
    })
    it('should return "normal" when all line types are different', () => {
      const delta = mockDocumentDelta([
        { insert: 'hi' },
        { insert: '\n', attributes: { $type: 'misc' } },
        { insert: 'feeling great', attributes: { bold: true } },
        { insert: '\n', attributes: { $type: 'rand' } },
        { insert: 'Felling good' },
        { insert: '\n', attributes: { $type: 'misc' } },
      ])
      expect(delta.getLineTypeInSelection(mockSelection(0, 31))).toEqual('normal')
    })
    it('should take into account lines which are not fully selected', () => {
      const delta = mockDocumentDelta([{ insert: 'hi' }, { insert: '\n', attributes: { $type: 'misc' } }])
      expect(delta.getLineTypeInSelection(mockSelection(0, 1))).toEqual('misc')
    })
  })
  describe('isLineInSelection', () => {
    const document = mockDocumentDelta([{ insert: 'A\nBC\nD\n' }])
    const lines = new LineWalker(document.ops).getLines()
    const firstLine = lines[0]
    const secondLine = lines[1]
    it('should match when the start selection index equals the begening of line index', () => {
      expect(isLineInSelection(mockSelection(0, 1), firstLine)).toBe(true)
    })
    it('should match when the end selection index equals the end of line index', () => {
      expect(isLineInSelection(mockSelection(1, 1), firstLine)).toBe(true)
      expect(isLineInSelection(mockSelection(4, 4), secondLine)).toBe(true)
    })
    it('should match when the start selection index is strictly inferior to the begening of line index and the end selection index is equal or superior to the begening of line index', () => {
      expect(isLineInSelection(mockSelection(1, 4), secondLine)).toBe(true)
      expect(isLineInSelection(mockSelection(1, 2), secondLine)).toBe(true)
    })
    it('should not match when the start selection index is gthen the end of line index', () => {
      expect(isLineInSelection(mockSelection(2, 2), firstLine)).toBe(false)
      expect(isLineInSelection(mockSelection(5, 5), secondLine)).toBe(false)
    })
  })
})
