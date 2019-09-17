import React, { ComponentType } from 'react'
import { Image as RNImage } from 'react-native'

export const StandardImageComponent = ({
  description,
  printDimensions: dimensions,
}: Images.ComponentProps<Images.StandardSource>) => {
  return <RNImage style={dimensions} source={description.source} {...dimensions} />
}

/**
 * A set of definitions related to images.
 *
 * @public
 */
export declare namespace Images {
  export interface StandardSource {
    uri: string
  }
  export interface Description<Source> {
    readonly source: Source
    readonly width: number
    readonly height: number
  }

  export interface Dimensions {
    readonly width: number
    readonly height: number
  }

  export type Component<Source> = ComponentType<ComponentProps<Source>>

  export interface ComponentProps<Source> {
    /**
     * The dimensions this component MUST occupy.
     */
    readonly printDimensions: Dimensions
    /**
     * The image description.
     */
    readonly description: Description<Source>
  }

  /**
   * An object used to locate and render images.
   */
  export interface Hooks<Source> {
    /**
     * Callback fired when an image has been successfully inserted.
     */
    readonly onImageAddedEvent?: (description: Description<Source>) => void
    /**
     * Callback fired when an image has been removed.
     */
    readonly onImageRemovedEvent?: (description: Description<Source>) => void
  }
}

/**
 *
 * @param originalDimensions - The image size.
 * @param containerWidth - The display container width.
 * @param userMaxHeight - The user provided max height.
 * @param userMaxWidth - The user provided max width.
 *
 * @internal
 */
export function computeImageFrame(
  originalDimensions: Images.Dimensions,
  containerWidth: number,
  userMaxHeight = Infinity,
  userMaxWidth = Infinity,
): Images.Dimensions {
  const { width, height } = originalDimensions
  const imageRatio = width / height
  const realMaxWidth = Math.min(userMaxWidth, containerWidth)
  const scaledWidthDimensions = {
    width: realMaxWidth,
    height: realMaxWidth / imageRatio,
  }
  if (scaledWidthDimensions.height > userMaxHeight) {
    return {
      width: userMaxHeight * imageRatio,
      height: userMaxHeight,
    }
  }
  return scaledWidthDimensions
}
