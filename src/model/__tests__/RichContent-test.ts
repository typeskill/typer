/* eslint-disable @typescript-eslint/no-unused-vars */
import { RichContent } from '@model/RichContent'

describe('@model/RichContent', () => {
  describe('::fromOps', () => {
    it('should instanciate from ops', () => {
      expect(() => {
        const content = RichContent.fromOps()
      }).not.toThrow()
    })
  })
  describe('::fromJSON', () => {
    it('should instanciate from JSON', () => {
      expect(() => {
        const content = RichContent.fromJSON('{ "ops":[] }')
      }).not.toThrow()
    })
    it('should throw SyntaxError when provided string is misformatted JSON', () => {
      expect(() => {
        const content = RichContent.fromJSON('[')
      }).toThrowError(SyntaxError)
    })
    it('should throw TypeError when provided string is not a JSON object', () => {
      expect(() => {
        const content = RichContent.fromJSON('{}')
      }).toThrowError(TypeError)
    })
    it('should throw TypeError when provided string is a JSON object missing "ops" property', () => {
      expect(() => {
        const content = RichContent.fromJSON('{}')
      }).toThrowError(TypeError)
    })
    it('should throw TypeError when provided string is a JSON object with "ops" property which is not an array', () => {
      expect(() => {
        const content = RichContent.fromJSON('{ "ops": {} }')
      }).toThrowError(TypeError)
    })
    describe('toJSON', () => {
      it('should return a JSON array of operations', () => {
        const serialized = RichContent.fromOps([{ insert: 'Hi' }]).toJSON()
        expect(JSON.parse(serialized)).toEqual({
          ops: [
            {
              insert: 'Hi',
            },
          ],
        })
      })
    })
  })
})
