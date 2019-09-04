import PropTypes from 'prop-types'
import { DocumentContent } from '@model/documents'
import { Toolbar } from './Toolbar'

export const OpsPropType = PropTypes.arrayOf(PropTypes.object)

const documentContentShape: Record<keyof DocumentContent, any> = {
  ops: OpsPropType,
  currentSelection: PropTypes.object,
  selectedTextAttributes: PropTypes.object,
}

const controlSpecsShape: Record<keyof Toolbar.ControlSpec, any> = {
  IconComponent: PropTypes.func.isRequired,
  actionType: PropTypes.number.isRequired,
  iconProps: PropTypes.object,
}

export const DocumentContentPropType = PropTypes.shape(documentContentShape)

export const ToolbarLayoutPropType = PropTypes.arrayOf(
  PropTypes.oneOfType([PropTypes.symbol, PropTypes.shape(controlSpecsShape)]),
)
