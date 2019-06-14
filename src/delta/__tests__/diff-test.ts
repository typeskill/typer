import { makeDiffDelta } from '@delta/diff'

describe('@delta/diff', () => {
  describe('makeDiffDelta', () => {
    it('should find the minimal set of diff operations', () => {
      const text1 = 'A\n'
      const text2 = 'A\nB\n'
      expect(makeDiffDelta(text1, text2, {})).toEqual({
        ops: [{ retain: 2 }, { insert: 'B\n' }],
      })
    })
    it('should not be greedy with words', () => {
      const text1 = 'A\nB C'
      const text2 = 'A\nB DEF'
      expect(makeDiffDelta(text1, text2, {})).toEqual({
        ops: [{ retain: 4 }, { insert: 'DEF' }, { delete: 1 }],
      })
    })
    it('should apply text attributes to characters within a line', () => {
      const text1 = 'A\nBC'
      const text2 = 'A\nBCDEF'
      expect(makeDiffDelta(text1, text2, { weight: 'bold' })).toEqual({
        ops: [{ retain: 4 }, { insert: 'DEF', attributes: { weight: 'bold' } }],
      })
    })
    it('should not apply text attributes to newline characters', () => {
      const text1 = 'A\nBC'
      const text2 = 'A\nBCDEF\nGHI'
      expect(makeDiffDelta(text1, text2, { weight: 'bold' })).toEqual({
        ops: [
          { retain: 4 },
          { insert: 'DEF', attributes: { weight: 'bold' } },
          { insert: '\n' },
          { insert: 'GHI', attributes: { weight: 'bold' } },
        ],
      })
    })
  })
})
