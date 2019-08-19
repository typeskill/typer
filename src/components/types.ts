import PropTypes from 'prop-types'

export const OpsPropType = PropTypes.arrayOf(PropTypes.object)

export const DocumentContentPropType = PropTypes.shape({
  ops: OpsPropType,
  currentSelection: PropTypes.object,
})

export const ToolbarLayoutPropType = PropTypes.arrayOf(
  PropTypes.oneOfType([
    PropTypes.symbol,
    PropTypes.shape({
      IconComponent: PropTypes.func.isRequired,
      actionType: PropTypes.number.isRequired,
      iconProps: PropTypes.object,
    }),
  ]),
)
