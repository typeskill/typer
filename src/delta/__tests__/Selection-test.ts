// tslint:disable:no-unused-expression
import { Selection } from '@delta/Selection'

describe('@delta/Selection', () => {
  describe('constructor', () => {
    it('should throw when start lower then end', () => {
      expect(() => {
        // @ts-ignore
        new Selection(0, -1)
      }).toThrow()
    })
  })
  describe('touchesIndex', () => {
    it('should be true with index strictly equals selection end', () => {
      const selection = Selection.fromBounds(0, 1)
      expect(selection.touchesIndex(1)).toBe(true)
    })
    it("should be false when index doesn't touch the edge of selection", () => {
      const selection = Selection.fromBounds(0, 1)
      expect(selection.touchesIndex(2)).toBe(false)
    })
  })
  describe('touchesSelection', () => {
    it('should be true when param selection touches the upper edge of selection', () => {
      const selection = Selection.fromBounds(0, 1)
      expect(selection.touchesSelection(Selection.fromBounds(1, 1))).toBe(true)
    })
    it("should be false when param selection doesn't touch the edge of selection", () => {
      const selection = Selection.fromBounds(0, 1)
      expect(selection.touchesSelection(Selection.fromBounds(2, 2))).toBe(false)
    })
  })
  describe('intersection', () => {
    it('should return a selection of length 1 when selection 2 has one cell overlapping over selection 1', () => {
      const selection1 = Selection.fromBounds(0, 2)
      const selection2 = Selection.fromBounds(1, 3)
      expect(selection1.intersection(selection2)).toMatchObject({
        start: 1,
        end: 2,
      })
    })
    it('should return null when selection 2 start equals selection 1 end', () => {
      const selection1 = Selection.fromBounds(0, 2)
      const selection2 = Selection.fromBounds(2, 3)
      expect(selection1.intersection(selection2)).toBeNull()
    })
    it('should return null when selection 2 start is superior to selection 1 end', () => {
      const selection1 = Selection.fromBounds(0, 2)
      const selection2 = Selection.fromBounds(3, 4)
      expect(selection1.intersection(selection2)).toBeNull()
    })
  })
})
