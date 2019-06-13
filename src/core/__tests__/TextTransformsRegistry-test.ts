import { TextTransformsRegistry, textTransformListToDict } from '@core/TextTransformsRegistry'
import { defaultTextTransforms, boldTransform, italicTransform, underlineTransform, strikethroughTransform } from '@core/transforms'

describe('@core/TextTransformsRegistry', () => {
  describe('textTransformListToDict', () => {
    it('should transform list to dictionnary', () => {
      const dict = textTransformListToDict(defaultTextTransforms)
      expect(dict).toEqual({
        bold: [boldTransform],
        italic: [italicTransform],
        textDecoration: [underlineTransform, strikethroughTransform]
      })
    })
  })
  describe('getStylesFromOp', () => {
    it('should merge styles from OP', () => {
      const registry = new TextTransformsRegistry(defaultTextTransforms)
      expect(registry.getStylesFromOp({
        insert: 'A',
        attributes: {
          textDecoration: 'underline',
          bold: true,
          italic: true
        }
      })).toEqual(expect.arrayContaining([{
        textDecorationStyle: 'solid',
        textDecorationLine: 'underline'
      }, {
        fontWeight: 'bold'
      }, {
        fontStyle: 'italic'
      }]))
    })
  })
})
