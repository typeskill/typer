import React, { PureComponent, SFC, ComponentType } from 'react'
import { View, TouchableOpacity, StyleProp, ViewStyle, ViewPropTypes, StyleSheet } from 'react-native'
import invariant from 'invariant'
import PropTypes from 'prop-types'
import { BaseTextTransformAttribute } from '@core/transforms'
import { Bridge } from '@core/Bridge'
import { TextAttributesMap } from '@delta/attributes'
import { TextLineType } from '@delta/lines'

export const TEXT_CONTROL_SEPARATOR = Symbol('separator')

export enum TextControlAction {
  SELECT_TEXT_BOLD,
  SELECT_TEXT_ITALIC,
  SELECT_TEXT_UNDERLINE,
  SELECT_TEXT_STRIKETHROUGH,
  SELECT_LINES_ORDERED_LIST,
  SELECT_LINES_UNORDERED_LIST
}

export interface TextControlMinimalIconProps {
  color: string,
  size: number
}

interface VectorIconMinimalProps extends TextControlMinimalIconProps {
  name: string
}

export interface TextControlSpec<T extends object> {
  IconComponent: ComponentType<TextControlMinimalIconProps & T>,
  actionType: TextControlAction
  iconProps?: T
}

export type ToolbarLayout = (TextControlSpec<any>|typeof TEXT_CONTROL_SEPARATOR)[]

export interface ToolbarProps {
  bridgeOuterInferface: Bridge.OuterInterface<BaseTextTransformAttribute>
  layout: ToolbarLayout
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

interface ButtonProps {
  selected: boolean,
  IconComponent: ComponentType<TextControlMinimalIconProps>
  onPress?: () => void,
  style?: StyleProp<ViewStyle>,
  iconProps?: object
}

const DEFAULT_ICON_SIZE = 32

export class Toolbar extends PureComponent<ToolbarProps, ToolbarState> {
  static propTypes = {
    bridgeOuterInferface: PropTypes.object.isRequired,
    layout: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.symbol,
      PropTypes.shape({
        IconComponent: PropTypes.func.isRequired,
        actionType: PropTypes.number.isRequired,
        iconProps: PropTypes.object
      })
    ])),
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
      marginRight: this.computeIconSpacing() * 2,
      marginLeft: this.computeIconSpacing()
    }
  })

  private IconButton: SFC<ButtonProps> = ({ onPress, selected, style, IconComponent, iconProps }) => {
    const dynamicStyle = selected ? this.getSelectedButtonStyle() : this.getDefaultButtonStyle()
    return (
      <TouchableOpacity onPress={onPress} style={[dynamicStyle, style]}>
        <IconComponent color={dynamicStyle.color as string} size={this.props.iconSize as number} {...iconProps} />
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

  private applyTextTransformToSelection(attributeName: BaseTextTransformAttribute, activeAttributeValue: any) {
    const nextAttributeValue = this.state.selectedAttributes[attributeName] === activeAttributeValue ? null : activeAttributeValue
    return () => {
      this.outerInterface.applyTextTransformToSelection(attributeName, nextAttributeValue)
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

  private renderTextTransformController(attributeName: BaseTextTransformAttribute, activeAttributeValue: any, textControlSpec: TextControlSpec<any>, last: boolean = false) {
    const { selectedAttributes } = this.state
    const IconButton = this.IconButton
    return (
      <IconButton selected={selectedAttributes[attributeName] === activeAttributeValue}
                  style={last ? undefined : { marginRight: this.computeIconSpacing() }}
                  IconComponent={textControlSpec.IconComponent}
                  iconProps={textControlSpec.iconProps}
                  onPress={this.applyTextTransformToSelection(attributeName, activeAttributeValue)} />

    )
  }

  private renderLineTransformController(lineType: TextLineType, textControlSpec: TextControlSpec<any>, last: boolean = false) {
    const { selectedLineType } = this.state
    const IconButton = this.IconButton
    return <IconButton selected={selectedLineType === lineType}
                       style={last ? undefined : { marginRight: this.computeIconSpacing() }}
                       IconComponent={textControlSpec.IconComponent}
                       iconProps={textControlSpec.iconProps}
                       onPress={this.applyLineTransformToSelection(lineType)} />
  }

  private renderIconControl(textControlSpec: TextControlSpec<any>, last: boolean) {
    switch (textControlSpec.actionType) {
    case TextControlAction.SELECT_TEXT_BOLD: return this.renderTextTransformController('bold', true, textControlSpec, last)
    case TextControlAction.SELECT_TEXT_ITALIC: return this.renderTextTransformController('italic', true, textControlSpec, last)
    case TextControlAction.SELECT_TEXT_UNDERLINE: return this.renderTextTransformController('textDecoration', 'underline', textControlSpec, last)
    case TextControlAction.SELECT_TEXT_STRIKETHROUGH: return this.renderTextTransformController('textDecoration', 'strikethrough', textControlSpec, last)
    case TextControlAction.SELECT_LINES_UNORDERED_LIST: return this.renderLineTransformController('ul', textControlSpec, last)
    case TextControlAction.SELECT_LINES_ORDERED_LIST: return this.renderLineTransformController('ol', textControlSpec, last)
    }
  }

  private renderIconControlsMap() {
    const { layout: textControlsMap } = this.props
    const Separator = this.Separator
    return textControlsMap.map((m, index) => {
      const key = `index-${index}`
      if (m === TEXT_CONTROL_SEPARATOR) {
        return <Separator key={key} />
      }
      return React.cloneElement(this.renderIconControl(m, index === textControlsMap.length - 1), { key })
    })
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
    return (
      <View style={[{ flexDirection: 'row', justifyContent: 'center' }, this.props.style]}>
        <View style={[[{ paddingHorizontal: this.computeIconSpacing() }, styles.container, this.props.contentContainerStyle]]}>
          {this.renderIconControlsMap()}
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

export function buildVectorIconControlSpec(IconComponent: ComponentType<VectorIconMinimalProps>, actionType: TextControlAction, name: string) {
  return {
    actionType,
    IconComponent,
    iconProps: { name }
  }
}
