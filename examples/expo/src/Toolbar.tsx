import React, { PureComponent, SFC } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import invariant from 'invariant'
import { Bridge, TextAttributesMap, BaseTextTransformAttribute, TextLineType } from 'react-native-typeskill'

export interface ToolbarProps {
  bridgeOuterInferface: Bridge.OuterInterface<BaseTextTransformAttribute>
}

interface ToolbarState {
  selectedAttributes: TextAttributesMap<BaseTextTransformAttribute>
  selectedLineType: TextLineType
}

const ITEM_SIZE = 32

const MaterialIconButton: SFC<{ name: string, onPress?: () => void, selected: boolean }> = ({ name, onPress, selected }) => (
  <TouchableOpacity onPress={onPress} style={selected ? { backgroundColor: 'yellow' } : undefined}>
    <MaterialCommunityIcons size={ITEM_SIZE} name={name} />
  </TouchableOpacity>
)

export default class Toolbar extends PureComponent<ToolbarProps, ToolbarState> {
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

  private renderTextTransformController(attributeName: BaseTextTransformAttribute, attributeValue: any, iconName: string) {
    const { selectedAttributes } = this.state
    return (
      <MaterialIconButton selected={selectedAttributes[attributeName] === attributeValue}
                          onPress={this.applyTextTransformToSelection(attributeName, attributeValue)} name={iconName} />

    )
  }

  private renderLineTransformController(lineType: TextLineType, iconName: string) {
    const { selectedLineType } = this.state
    return <MaterialIconButton selected={selectedLineType === lineType}
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
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        <View style={{ flexDirection: 'row' }}>
          {this.renderTextTransformController('bold', true, 'format-bold')}
          {this.renderTextTransformController('italic', true, 'format-italic')}
          {this.renderTextTransformController('textDecoration', 'underline', 'format-underline')}
          {this.renderTextTransformController('textDecoration', 'strikethrough', 'format-strikethrough-variant')}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {this.renderLineTransformController('ul', 'format-list-bulleted')}
          {this.renderLineTransformController('ol', 'format-list-numbered')}
        </View>
      </View>
    )
  }
}
