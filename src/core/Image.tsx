import React, { ComponentType } from 'react'
import { Image as RNImage, ImageSourcePropType } from 'react-native'

/**
 * @public
 */
export const defaultImageLocator: Image.LocationService<Image.StandardDefinition> = {
  Component({ params, dimensions }: Image.ComponentProps<Image.StandardDefinition>) {
    return <RNImage style={dimensions} source={params.source} {...dimensions} />
  },
  computeImageDimensions({ width, height }, containerWidth) {
    return width > containerWidth
      ? { width: containerWidth, height: (height * containerWidth) / width }
      : { width, height }
  },
  async pickOneImage() {
    throw new Error(
      `Typeskill won't chose an image picker for you. You must provide your own imageLocatorService in renderingConfig prop.`,
    )
  },
}

/**
 * A set of definitions related to images.
 *
 * @public
 */
export declare namespace Image {
  export interface StandardDefinition {
    readonly source: ImageSourcePropType
    readonly width: number
    readonly height: number
  }

  export interface Dimensions {
    readonly width: number
    readonly height: number
  }

  export interface ComponentProps<D> {
    readonly dimensions: Dimensions
    readonly params: D
  }
  /**
   * An object used to locate and render images.
   */
  export interface LocationService<D> {
    /**
     * The image component to render.
     *
     * @remarks The component MUST fit within the provided dimensions properties.
     */
    readonly Component: ComponentType<ComponentProps<D>>
    /**
     * Compute display dimensions from image info and content width.
     */
    readonly computeImageDimensions: (params: D, contentWidth: number) => Dimensions
    /**
     * An async function that returns the description of an image.
     */
    readonly pickOneImage: () => Promise<D>
    /**
     * Callback fired when an image has been successfully inserted.
     */
    readonly onImageAddedEvent?: (description: D) => void
    /**
     * Callback fired when an image has been removed.
     */
    readonly onImageRemovedEvent?: (description: D) => void
  }
}
