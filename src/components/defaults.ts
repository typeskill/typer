import { StandardImageComponent } from '@core/Images'
import { defaultTextTransforms } from '@core/Transforms'

export const defaults = {
  spacing: 15,
  ImageComponent: StandardImageComponent,
  textTransformsSpecs: defaultTextTransforms,
  underlayColor: 'rgba(30,30,30,0.3)',
  imageHooks: {},
}
