import { Attributes } from '@delta/attributes'
import { Transforms, defaultTextTransforms } from './Transforms'
import { Images, defaultImageLocator } from './Images'

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
  export interface Config<ImageSource> {
    /**
     * A list of {@link (Transforms:namespace).GenericSpec | specs} which will be used to map text attributes with styles.
     */
    textTransformSpecs: Transforms.GenericSpec<Attributes.TextValue, 'text'>[]
    /**
     * An object describing the behavior to locate and render images.
     *
     * @remarks Were this parameter not provided, images interactions will be disabled in the related {@link (Typer:type)}.
     */
    imageLocatorService: Images.LocationService<ImageSource>
  }
  /**
   * A service providing rendering behviors.
   */
  export interface Service<ImageSource> {
    imageLocator: Images.LocationService<ImageSource>
    textTransforms: Transforms
  }
}

export const defaultRenderConfig: Gen.Config<Images.StandardSource> = {
  textTransformSpecs: defaultTextTransforms,
  imageLocatorService: defaultImageLocator,
}
