import React, { PureComponent, SFC } from 'react'
import { View, TouchableOpacity, StyleProp, ViewStyle, ViewPropTypes, StyleSheet } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import invariant from 'invariant'
import { Bridge, TextAttributesMap, BaseTextTransformAttribute, TextLineType } from 'react-native-typeskill'
import PropTypes from 'prop-types'

export interface ToolbarProps {
  bridgeOuterInferface: Bridge.OuterInterface<BaseTextTransformAttribute>
  defaultButtonBackgroundColor?: string
  defaultButtonColor?: string
  selectedButtonBackgroundColor?: string
  selectedButtonColor?: string
  separatorColor?: string
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  iconSize?: number
  iconSpacing?: number
}

interface ToolbarState {
  selectedAttributes: TextAttributesMap<BaseTextTransformAttribute>
  selectedLineType: TextLineType
}

const DEFAULT_ICON_SIZE = 32

class Toolbar extends PureComponent<ToolbarProps, ToolbarState> {
  static propTypes = {
    bridgeOuterInferface: PropTypes.object.isRequired,
    defaultButtonBackgroundColor: PropTypes.string,
    defaultButtonColor: PropTypes.string,
    selectedButtonBackgroundColor: PropTypes.string,
    selectedButtonColor: PropTypes.string,
    separatorColor: PropTypes.string,
    style: ViewPropTypes.style,
    contentContainerStyle: ViewPropTypes.style,
    iconSize: PropTypes.number,
    iconSpacing: PropTypes.number
  }

  static defaultProps = {
    defaultButtonBackgroundColor: 'transparent',
    defaultButtonColor: '#3a404c',
    selectedButtonBackgroundColor: 'transparent',
    selectedButtonColor: '#4286f4',
    separatorColor: '#646e82',
    iconSize: DEFAULT_ICON_SIZE
  }

  private outerInterface: Bridge.OuterInterface<BaseTextTransformAttribute>

  state: ToolbarState = {
    selectedAttributes: {},
    selectedLineType: 'normal'
  }

  constructor(props: ToolbarProps) {
    super(props)
    this.outerInterface = props.bridgeOuterInferface
    invariant(props.bridgeOuterInferface != null, 'bridgeOuterInferface prop is required')
  }

  private Separator: SFC<{}> = () => React.createElement(View, {
    style: {
      height: this.props.iconSize,
      width: 2,
      backgroundColor: this.props.separatorColor,
      marginHorizontal: this.computeIconSpacing() * 2
    }
  })

  private MaterialIconButton: SFC<{ name: string, onPress?: () => void, selected: boolean, style?: StyleProp<ViewStyle> }> = ({ name, onPress, selected, style }) => {
    const dynamicStyle = selected ? this.getSelectedButtonStyle() : this.getDefaultButtonStyle()
    return (
      <TouchableOpacity onPress={onPress} style={[dynamicStyle, style]}>
        <MaterialCommunityIcons color={dynamicStyle.color} size={this.props.iconSize} name={name} />
      </TouchableOpacity>
    )
  }

  private getDefaultButtonStyle() {
    return {
      color: this.props.defaultButtonColor,
      backgroundColor: this.props.defaultButtonBackgroundColor
    }
  }

  private getSelectedButtonStyle() {
    return {
      color: this.props.selectedButtonColor,
      backgroundColor: this.props.selectedButtonBackgroundColor
    }
  }

  private applyTextTransformToSelection(attributeName: BaseTextTransformAttribute, attributeValue: any) {
    return () => {
      this.outerInterface.applyTextTransformToSelection(attributeName, attributeValue)
    }
  }

  private applyLineTransformToSelection(lineType: TextLineType) {
    return () => {
      this.outerInterface.applyLineTransformToSelection(lineType)
    }
  }

  private computeIconSpacing() {
    return typeof this.props.iconSpacing === 'number' ? this.props.iconSpacing : this.props.iconSize as number / 3
  }

  private renderTextTransformController(attributeName: BaseTextTransformAttribute, attributeValue: any, iconName: string, last: boolean = false) {
    const { selectedAttributes } = this.state
    const MaterialIconButton = this.MaterialIconButton
    return (
      <MaterialIconButton selected={selectedAttributes[attributeName] === attributeValue}
                          style={last ? undefined : { marginRight: this.computeIconSpacing() }}
                          onPress={this.applyTextTransformToSelection(attributeName, attributeValue)} name={iconName} />

    )
  }

  private renderLineTransformController(lineType: TextLineType, iconName: string, last: boolean = false) {
    const { selectedLineType } = this.state
    const MaterialIconButton = this.MaterialIconButton
    return <MaterialIconButton selected={selectedLineType === lineType}
                               style={last ? undefined : { marginRight: this.computeIconSpacing() }}
                               onPress={this.applyLineTransformToSelection(lineType)} name={iconName} />
  }

  componentDidMount() {
    this.outerInterface.addSelectedAttributesChangeListener(this, (selectedAttributes) => {
      this.setState({ selectedAttributes })
    })
    this.outerInterface.addSelectedLineTypeChangeListener(this, (selectedLineType) => {
      this.setState({ selectedLineType })
    })
  }

  componentWillReceiveProps(nextProps: ToolbarProps) {
    invariant(nextProps.bridgeOuterInferface === this.props.bridgeOuterInferface, "bridgeOuterInferface prop cannot be changed during Toolbar's lifetime.")
  }

  componentWillUnmount() {
    this.outerInterface.release(this)
  }

  render() {
    const Separator = this.Separator
    return (
      <View style={[{ flexDirection: 'row', justifyContent: 'center' }, this.props.style]}>
        <View style={[[{ paddingHorizontal: this.computeIconSpacing() }, styles.container, this.props.contentContainerStyle]]}>
          <View style={{ flexDirection: 'row' }}>
            {this.renderTextTransformController('bold', true, 'format-bold')}
            {this.renderTextTransformController('italic', true, 'format-italic')}
            {this.renderTextTransformController('textDecoration', 'underline', 'format-underline')}
            {this.renderTextTransformController('textDecoration', 'strikethrough', 'format-strikethrough-variant', true)}
          </View>
          <Separator />
          <View style={{ flexDirection: 'row' }}>
            {this.renderLineTransformController('ul', 'format-list-bulleted')}
            {this.renderLineTransformController('ol', 'format-list-numbered', true)}
          </View>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    flexDirection: 'row',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  }
})

export default Toolbar
