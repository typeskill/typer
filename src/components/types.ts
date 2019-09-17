import PropTypes from 'prop-types'
import { Document } from '@model/document'
import { Toolbar } from './Toolbar'
import { Images } from '@core/Images'

export const OpsPropType = PropTypes.arrayOf(PropTypes.object)

const documentShape: Record<keyof Document, any> = {
  ops: OpsPropType,
  currentSelection: PropTypes.object,
  selectedTextAttributes: PropTypes.object,
  lastDiff: OpsPropType,
}

const controlSpecsShape: Record<keyof Toolbar.ControlSpec, any> = {
  IconComponent: PropTypes.func.isRequired,
  actionType: PropTypes.number.isRequired,
  iconProps: PropTypes.object,
}

export const DocumentPropType = PropTypes.shape(documentShape)

export const ToolbarLayoutPropType = PropTypes.arrayOf(
  PropTypes.oneOfType([PropTypes.symbol, PropTypes.shape(controlSpecsShape)]),
)

const imagesHookShape: Record<keyof Images.Hooks<any>, any> = {
  onImageAddedEvent: PropTypes.func,
  onImageRemovedEvent: PropTypes.func,
}

export const ImageHooksType = PropTypes.shape(imagesHookShape)
export const TextTransformSpecsType = PropTypes.arrayOf(PropTypes.object)
