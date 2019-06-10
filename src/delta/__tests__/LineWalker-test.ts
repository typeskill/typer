import { mockDocumentDelta } from '@test/document'
import { LineWalker } from '@delta/LineWalker'
import zip from 'ramda/es/zip'

describe('@delta/LineWalker', () => {
  describe('getLines', () => {
    it('should group lines by trailing newline characters', () => {
      const delta = mockDocumentDelta([{ insert: 'AB\nCD\n' }])
      const walker = new LineWalker(delta)
      const lines = walker.getLines()
      expect(lines.length).toBe(2)
    })
    it('should produce line ranges complying with the substring contract', () => {
      const textLines = ['AB', 'CD']
      const fullText = 'AB\nCD\n'
      const delta = mockDocumentDelta([{ insert: fullText }])
      const walker = new LineWalker(delta)
      const lines = walker.getLines()
      for (const [line, textLine] of zip(lines, textLines)) {
        expect(fullText.substring(line.lineRange.start, line.lineRange.end)).toBe(textLine)
      }
    })
    it('should produce line ranges for which the character at range.end is a newline', () => {
      const fullText = 'AB\nCD\n'
      const delta = mockDocumentDelta([{ insert: fullText }])
      const walker = new LineWalker(delta)
      const lines = walker.getLines()
      for (const line of lines) {
        expect(fullText.charAt(line.lineRange.end)).toBe('\n')
      }
    })
  })
})
