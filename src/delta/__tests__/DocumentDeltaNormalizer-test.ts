import { DocumentDeltaNormalizer } from '@delta/DocumentDeltaNormalizer'
import { mockDocumentDelta } from '@test/document'
import { getHeadingCharactersFromType } from '@delta/lines'
import { mockDeltaChangeContext } from '@test/delta'
import { NormalizeDirective, NormalizeOperation } from '@delta/DeltaDiffComputer'
import { makeDiffDelta } from '@delta/diff'

describe('@delta/DocumentDeltaNormalizer', () => {
  describe('constructor', () => {
    it('should not throw', () => {
      expect(() => {
        // tslint:disable-next-line:no-unused-expression
        new DocumentDeltaNormalizer(mockDocumentDelta())
      }).not.toThrow()
    })
  })

  describe('apply', () => {
    it('should handle insert line type prefix directives', () => {
      const head = getHeadingCharactersFromType('ul', 0)
      const changeContext = mockDeltaChangeContext(head.length + 6, head.length + 7)
      const deltaAfterChange = mockDocumentDelta([
        { insert: head + 'Hello ' },
        { insert: '\n', attributes: { $type: 'ul' } },
        { insert: 'world' },
        { insert: '\n', attributes: { $type: 'ul' } },
      ])
      const directives: NormalizeDirective[] = [
        {
          beginningOfLineIndex: (deltaAfterChange.ops[0].insert as string).length + 1,
          context: changeContext,
          type: NormalizeOperation.INSERT_LINE_TYPE_PREFIX,
          diff: makeDiffDelta('world', 'world', {}),
        },
      ]
      const normalizer = new DocumentDeltaNormalizer(deltaAfterChange)
      const { delta } = normalizer.apply(directives)
      expect(delta.ops).toEqual([
        { insert: head + 'Hello ' },
        { insert: '\n', attributes: { $type: 'ul' } },
        { insert: head + 'world' },
        { insert: '\n', attributes: { $type: 'ul' } },
      ])
    })
    it('should handle investigate deletion prefix directives after text deleted', () => {
      const head = getHeadingCharactersFromType('ul', 0)
      const changeContext = mockDeltaChangeContext(1, 2)
      const originalText = head + 'Hello'
      const textAfterChange = `${head.slice(0, 1)}${head.slice(2, head.length)}Hello`
      const deltaAfterChange = mockDocumentDelta([
        { insert: textAfterChange },
        { insert: '\n', attributes: { $type: 'ul' } },
      ])
      const directives: NormalizeDirective[] = [
        {
          beginningOfLineIndex: 0,
          context: changeContext,
          diff: makeDiffDelta(originalText, textAfterChange, {}),
          type: NormalizeOperation.INVESTIGATE_DELETION,
        },
      ]
      const normalizer = new DocumentDeltaNormalizer(deltaAfterChange)
      const { delta, overridingSelection } = normalizer.apply(directives)
      expect(delta.ops).toEqual([{ insert: 'Hello\n' }])
      expect(overridingSelection).toMatchObject({
        start: 0,
        end: 0,
      })
    })
    it('should handle investigate deletion prefix directives after text replaced', () => {
      const head = getHeadingCharactersFromType('ul', 0)
      const changeContext = mockDeltaChangeContext(1, 2, 2)
      const originalText = head + 'Hello'
      const textAfterChange = `${head.slice(0, 1)}l${head.slice(2, head.length)}Hello`
      const deltaAfterChange = mockDocumentDelta([
        { insert: textAfterChange },
        { insert: '\n', attributes: { $type: 'ul' } },
      ])
      const directives: NormalizeDirective[] = [
        {
          beginningOfLineIndex: 0,
          context: changeContext,
          diff: makeDiffDelta(originalText, textAfterChange, {}),
          type: NormalizeOperation.INVESTIGATE_DELETION,
        },
      ]
      const normalizer = new DocumentDeltaNormalizer(deltaAfterChange)
      const { delta, overridingSelection } = normalizer.apply(directives)
      expect(delta.ops).toEqual([{ insert: `l${head.slice(2, head.length)}Hello\n` }])
      expect(overridingSelection).toMatchObject({
        start: 1,
        end: 1,
      })
    })
    it('should handle check line type prefix directives', () => {
      const head = getHeadingCharactersFromType('ul', 0)
      const changeContext = mockDeltaChangeContext(1, 2)
      const originalText = head + 'Hello'
      const textAfterChange = `${head.slice(0, 2)}l${head.slice(2, head.length)}Hello`
      const deltaAfterChange = mockDocumentDelta([
        { insert: textAfterChange },
        { insert: '\n', attributes: { $type: 'ul' } },
      ])
      const directives: NormalizeDirective[] = [
        {
          beginningOfLineIndex: 0,
          context: changeContext,
          diff: makeDiffDelta(originalText, textAfterChange, {}),
          type: NormalizeOperation.CHECK_LINE_TYPE_PREFIX,
        },
      ]
      const normalizer = new DocumentDeltaNormalizer(deltaAfterChange)
      const { delta, overridingSelection } = normalizer.apply(directives)
      const expected = `${head}lHello`
      expect(delta.ops).toEqual([{ insert: expected }, { insert: '\n', attributes: { $type: 'ul' } }])
      expect(overridingSelection).toMatchObject({
        start: head.length + 1,
        end: head.length + 1,
      })
    })
  })
})
