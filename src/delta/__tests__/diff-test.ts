import { makeDiffDelta, getLineDiffReports } from '@delta/diff'

describe('@delta/diff', () => {
  describe('getLineDiffReports', () => {
    it('should detect insertions', () => {
      const text1 = 'A\n'
      const text2 = 'A\nB\n'
      const lineDiffReports = getLineDiffReports(text1, text2)
      expect(lineDiffReports).toMatchObject([
        { kind: 'RETAINED', value: 'A\n', count: 1 },
        { kind: 'INSERTED', value: 'B\n', count: 1 }
      ])
    })
    it('should detect replacements', () => {
      const text1 = 'A\nB\n'
      const text2 = 'A\nC\n'
      const lineDiffReports = getLineDiffReports(text1, text2)
      expect(lineDiffReports).toMatchObject([
        { kind: 'RETAINED', value: 'A\n', count: 1 },
        { kind: 'REPLACED', value: 'C\n', count: 1 }
      ])
    })
    it('should not be greedy with lines', () => {
      const text1 = 'A\nB\nC\nD\nE\n'
      const text2 = 'A\nB\nF\nG\nE\n'
      const lineDiffReports = getLineDiffReports(text1, text2)
      expect(lineDiffReports).toMatchObject([
        { kind: 'RETAINED', value: 'A\nB\n', count: 2 },
        { kind: 'REPLACED', value: 'F\nG\n', count: 1 },
        { kind: 'RETAINED', value: 'E\n', count: 1 }
      ])
    })
  })
  describe('makeDiffDelta', () => {
    it('should find the minimal set of diff operations', () => {
      const text1 = 'A\n'
      const text2 = 'A\nB\n'
      expect(makeDiffDelta(text1, text2)).toEqual({
        ops: [
          { retain: 2 },
          { insert: 'B\n' }
        ]
      })
    })
    it('should not be greedy with words', () => {
      const text1 = 'A\nB C'
      const text2 = 'A\nB DEF'
      expect(makeDiffDelta(text1, text2)).toEqual({
        ops: [
          { retain: 4 },
          { insert: 'DEF' },
          { delete: 1 }
        ]
      })
    })
  })
})
