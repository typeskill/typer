import PropTypes from 'prop-types'
import { Document } from '@model/document'
import { Toolbar } from './Toolbar'

export const OpsPropType = PropTypes.arrayOf(PropTypes.object)

const documentShape: Record<keyof Document, any> = {
  ops: OpsPropType,
  currentSelection: PropTypes.object,
  selectedTextAttributes: PropTypes.object,
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
