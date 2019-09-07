import { Attributes } from '@delta/attributes'
import { Transforms, defaultTextTransforms } from './Transforms'
import { Image, defaultImageLocator } from './Image'

/**
 * A set of definitions related to rich content generation.
 *
 * @public
 */
export declare namespace Gen {
  /**
   * An object defining custom rendering behaviors.
   *
   * @public
   */
  export interface Config<D extends {}> {
    /**
     * A list of {@link (Transforms:namespace).GenericSpec | specs} which will be used to map text attributes with styles.
     */
    textTransformSpecs: Transforms.GenericSpec<Attributes.TextValue, 'text'>[]
    /**
     * An object describing the behavior to locate and render images.
     *
     * @remarks Were this parameter not provided, images interactions will be disabled in the related {@link (Typer:type)}.
     */
    imageLocatorService: Image.LocationService<D>
  }
  /**
   * A service providing rendering behviors.
   */
  export interface Service {
    imageLocator: Image.LocationService<any>
    textTransforms: Transforms
  }
}

export const defaultRenderConfig: Gen.Config<any> = {
  textTransformSpecs: defaultTextTransforms,
  imageLocatorService: defaultImageLocator,
}
