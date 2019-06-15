import PropTypes from 'prop-types'

export const RichContentPropType = PropTypes.shape({
  ops: PropTypes.arrayOf(PropTypes.object),
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
