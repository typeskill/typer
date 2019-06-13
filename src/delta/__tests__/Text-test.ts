import { Text } from '@delta/Text'
import { Selection } from '@delta/Selection'
import zip from 'ramda/es/zip'

describe('@delta/Text', () => {
  describe('getSelectionEncompassingLines', () => {
    it('should encompass line when the start touches the end of line', () => {
      const text = new Text('ABC\nDEF\n')
      expect(text.getSelectionEncompassingLines(Selection.fromBounds(3))).toMatchObject({
        start: 0,
        end: 3
      })
    })
    it('should encompass line when the start touches the beginning of a line', () => {
      const text = new Text('ABC\nDEF\n')
      expect(text.getSelectionEncompassingLines(Selection.fromBounds(4))).toMatchObject({
        start: 4,
        end: 7
      })
    })
    it('should encompass two lines when start touches the end of a line and end touches the beginning of its sibling', () => {
      const text = new Text('ABC\nDEF\n')
      expect(text.getSelectionEncompassingLines(Selection.fromBounds(3, 4))).toMatchObject({
        start: 0,
        end: 7
      })
    })
  })
  describe('select', () => {
    it('should return a Text instance wihch is an absolutely positionned substring of `this`', () => {
      const text = new Text('BCD', 1)
      const subText = text.select(Selection.fromBounds(1, 3))
      expect(subText.raw).toBe('BC')
      expect(subText.beginningIndex).toBe(1)
    })
  })
  describe('substring', () => {
    it('should return a substring which origin is the beginning of index', () => {
      const text = new Text('BCD', 1)
      const subtext = text.substring(1, 3)
      expect(subtext).toBe('BC')
    })
  })
  describe('charAt', () => {
    it('should return a character document positionned', () => {
      const text = new Text('BCD', 1)
      expect(text.charAt(1)).toBe('B')
    })
  })
  describe('getLines', () => {
    it('should split lines by newline characters', () => {
      const fullText = 'AB\nCD'
      const text = new Text(fullText)
      expect(text.getLines().length).toBe(2)
    })
    it('should produce line ranges complying with the substring contract', () => {
      const fullText = 'AB\nCD'
      const textLines = ['AB', 'CD']
      const text = new Text(fullText)
      const lines = text.getLines()
      for (const [line, textLine] of zip(lines, textLines)) {
        expect(fullText.substring(line.lineRange.start, line.lineRange.end)).toBe(textLine)
      }
    })
    it('should produce line ranges for which the character at range.end is a newline except for last line', () => {
      const fullText = 'AB\nCD'
      const text = new Text(fullText)
      const lines = text.getLines()
      for (const line of lines.slice(0, 1)) {
        expect(fullText.charAt(line.lineRange.end)).toBe('\n')
      }
    })
  })
})
