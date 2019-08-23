import React, { PureComponent, SFC, ComponentType, ComponentClass } from 'react'
import { View, TouchableOpacity, StyleProp, ViewStyle, ViewPropTypes, StyleSheet } from 'react-native'
import invariant from 'invariant'
import PropTypes from 'prop-types'
import { Transforms } from '@core/Transforms'
import { Bridge } from '@core/Bridge'
import { Attributes } from '@delta/attributes'
import { ToolbarLayoutPropType } from './types'

/**
 * Constant used within a {@link (Toolbar:namespace).Layout} to denote a separator.
 *
 * @public
 */
export const CONTROL_SEPARATOR = Symbol('separator')

/**
 * Actions which can be triggered with the {@link (Toolbar:type)} component.
 *
 * @public
 */
export enum ControlAction {
  /**
   * Switch bold formatting in the selected text.
   */
  SELECT_TEXT_BOLD,
  /**
   * Switch italic formatting in the selected text.
   */
  SELECT_TEXT_ITALIC,
  /**
   * Switch underline formatting in the selected text.
   */
  SELECT_TEXT_UNDERLINE,
  /**
   * Switch strikethrough formatting in the selected text.
   */
  SELECT_TEXT_STRIKETHROUGH,
  /**
   * Insert an image at selection.
   */
  INSERT_IMAGE_AT_SELECTION,
}

/**
 * A set of definitions related to the {@link (Toolbar:type)} component.
 *
 * @public
 */
declare namespace Toolbar {
  /**
   * An object describing the characteristics of a control.
   */
  export interface ControlSpec<T extends object = {}> {
    /**
     * The react {@link react#ComponentType} representing the rendered icon.
     *
     * @remarks
     *
     * - This icon component is expected to at least support {@link (Toolbar:namespace).TextControlMinimalIconProps}.
     * - The component will optionally receive `iconProps`.
     * - The icon should have a transparent background.
     */
    IconComponent: ComponentType<TextControlMinimalIconProps & T>
    /**
     * The action performed when the control is actionated.
     */
    actionType: ControlAction
    /**
     * The props passed to `IconComponent`
     */
    iconProps?: T extends Toolbar.VectorIconMinimalProps ? Toolbar.VectorIconMinimalProps : Partial<T>
  }
  /**
   * Declaratively describes the layout of the {@link (Toolbar:type)} component.
   */
  export type Layout = (ControlSpec<any> | typeof CONTROL_SEPARATOR)[]

  /**
   * Props of the {@link (Toolbar:type)} component.
   */
  export interface Props<D extends Bridge.MinimalImageProps> {
    /**
     * The instance to be shared with the {@link (Sheet:type)}.
     */
    bridge: Bridge<D>
    /**
     * The attributes actives in selection.
     *
     * @remarks You should provide those of your {@link DocumentContent | `documentContent`} instance.
     */
    selectedTextAttributes: Attributes.Map
    /**
     * A callback fired when inserting an image results in an error.
     */
    onInsertImageError?: (e: Error) => void
    /**
     * An array describing the resulting layout of this component.
     */
    layout: Layout
    /**
     * Button background when a control is not in active state.
     */
    inactiveButtonBackgroundColor?: string
    /**
     * Button icon color when a control is not in active state.
     */
    inactiveButtonColor?: string
    /**
     * Button icon color when a control is in active state.
     */
    activeButtonBackgroundColor?: string
    /**
     * Button background when a control is in active state.
     */
    activeButtonColor?: string
    /**
     * The color of the separator.
     *
     * @remarks
     *
     * A separator can be defined by inserting {@link CONTROL_SEPARATOR} constant to the `layout` prop.
     */
    separatorColor?: string
    /**
     * Style of the root component.
     */
    style?: StyleProp<ViewStyle>
    /**
     * Style of the container component encompassing all controls.
     */
    contentContainerStyle?: StyleProp<ViewStyle>
    /**
     * Icon size.
     */
    iconSize?: number
    /**
     * The space between two buttons.
     */
    buttonSpacing?: number
  }

  /**
   * The props passed to every icon {@link react#ComponentType}.
   */
  export interface TextControlMinimalIconProps {
    /**
     * Icon color.
     *
     * @remarks
     *
     * The color varies depending on the active state.
     * Will receive {@link (Toolbar:namespace).Props.inactiveButtonColor} when not active and
     * {@link (Toolbar:namespace).Props.activeButtonColor} when active.
     */
    color?: string
    /**
     * Icon size.
     */
    size?: number
  }

  /**
   * The shape of expected props to an icon from {@link https://www.npmjs.com/package/react-native-vector-icons | react-native-vector-icons}.
   */
  export interface VectorIconMinimalProps {
    /**
     * Icon name.
     */
    name: string
  }
}

interface ToolbarState {
  selectedAttributes: Attributes.Map
  selectedLineType: Attributes.LineType
}

interface ButtonProps {
  selected: boolean
  IconComponent: ComponentType<Toolbar.TextControlMinimalIconProps>
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  iconProps?: object
}

const DEFAULT_ICON_SIZE = 32

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    flexDirection: 'row',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
})

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Toolbar<D extends Bridge.MinimalImageProps> extends PureComponent<Toolbar.Props<D>> {
  public static propTypes: Record<keyof Toolbar.Props<any>, any> = {
    bridge: PropTypes.instanceOf(Bridge).isRequired,
    selectedTextAttributes: PropTypes.object.isRequired,
    onInsertImageError: PropTypes.func,
    layout: ToolbarLayoutPropType,
    inactiveButtonBackgroundColor: PropTypes.string,
    inactiveButtonColor: PropTypes.string,
    activeButtonBackgroundColor: PropTypes.string,
    activeButtonColor: PropTypes.string,
    separatorColor: PropTypes.string,
    style: ViewPropTypes.style,
    contentContainerStyle: ViewPropTypes.style,
    iconSize: PropTypes.number,
    buttonSpacing: PropTypes.number,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static defaultProps: Partial<Record<keyof Toolbar.Props<any>, any>> = {
    inactiveButtonBackgroundColor: 'transparent',
    inactiveButtonColor: '#3a404c',
    activeButtonBackgroundColor: 'transparent',
    activeButtonColor: '#4286f4',
    separatorColor: '#646e82',
    iconSize: DEFAULT_ICON_SIZE,
  }

  private controlEventDom: Bridge.ControlEventDomain<D>

  public state: ToolbarState = {
    selectedAttributes: {},
    selectedLineType: 'normal',
  }

  public constructor(props: Toolbar.Props<D>) {
    super(props)
    invariant(props.bridge != null, 'bridge prop is required')
    this.controlEventDom = props.bridge.getControlEventDomain()
    this.insertImageAtSelection = this.insertImageAtSelection.bind(this)
  }

  private Separator: SFC<{}> = () =>
    React.createElement(View, {
      style: {
        height: this.props.iconSize,
        width: 2,
        backgroundColor: this.props.separatorColor,
        marginRight: this.computeIconSpacing() * 2,
        marginLeft: this.computeIconSpacing(),
      },
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
      color: this.props.inactiveButtonColor,
      backgroundColor: this.props.inactiveButtonBackgroundColor,
    }
  }

  private getSelectedButtonStyle() {
    return {
      color: this.props.activeButtonColor,
      backgroundColor: this.props.activeButtonBackgroundColor,
    }
  }

  private async insertImageAtSelection() {
    try {
      const description = await this.props.bridge.getImageLocator().pickOneImage()
      this.controlEventDom.insertOrReplaceAtSelection({ type: 'image', description })
    } catch (e) {
      this.props.onInsertImageError && this.props.onInsertImageError(e)
    }
  }

  private applyTextTransformToSelection(
    attributeName: Transforms.TextAttributeName,
    activeAttributeValue: Attributes.TextValue,
  ) {
    const nextAttributeValue =
      this.props.selectedTextAttributes[attributeName] === activeAttributeValue ? null : activeAttributeValue
    return () => {
      this.controlEventDom.applyTextTransformToSelection(attributeName, nextAttributeValue)
    }
  }

  private computeIconSpacing() {
    return typeof this.props.buttonSpacing === 'number' ? this.props.buttonSpacing : (this.props.iconSize as number) / 3
  }

  private renderInsertImageController(textControlSpec: Toolbar.ControlSpec, last: boolean = false) {
    const IconButton = this.IconButton
    return (
      <IconButton
        selected={false}
        style={last ? undefined : { marginRight: this.computeIconSpacing() }}
        IconComponent={textControlSpec.IconComponent}
        iconProps={textControlSpec.iconProps}
        onPress={this.insertImageAtSelection}
      />
    )
  }

  private renderTextTransformController(
    attributeName: Transforms.TextAttributeName,
    activeAttributeValue: Attributes.TextValue,
    textControlSpec: Toolbar.ControlSpec,
    last: boolean = false,
  ) {
    const { selectedTextAttributes: selectedAttributes } = this.props
    const IconButton = this.IconButton
    return (
      <IconButton
        selected={selectedAttributes[attributeName] === activeAttributeValue}
        style={last ? undefined : { marginRight: this.computeIconSpacing() }}
        IconComponent={textControlSpec.IconComponent}
        iconProps={textControlSpec.iconProps}
        onPress={this.applyTextTransformToSelection(attributeName, activeAttributeValue)}
      />
    )
  }

  private renderIconControl(textControlSpec: Toolbar.ControlSpec, last: boolean) {
    switch (textControlSpec.actionType) {
      case ControlAction.SELECT_TEXT_BOLD:
        return this.renderTextTransformController('bold', true, textControlSpec, last)
      case ControlAction.SELECT_TEXT_ITALIC:
        return this.renderTextTransformController('italic', true, textControlSpec, last)
      case ControlAction.SELECT_TEXT_UNDERLINE:
        return this.renderTextTransformController('textDecoration', 'underline', textControlSpec, last)
      case ControlAction.SELECT_TEXT_STRIKETHROUGH:
        return this.renderTextTransformController('textDecoration', 'strikethrough', textControlSpec, last)
      case ControlAction.INSERT_IMAGE_AT_SELECTION:
        return this.renderInsertImageController(textControlSpec, last)
    }
  }

  private renderIconControlsMap() {
    const { layout: textControlsMap } = this.props
    const Separator = this.Separator
    return textControlsMap.map((m, index) => {
      const key = `index-${index}`
      if (m === CONTROL_SEPARATOR) {
        return <Separator key={key} />
      }
      return React.cloneElement(this.renderIconControl(m, index === textControlsMap.length - 1), { key })
    })
  }

  public componentDidUpdate(oldProps: Toolbar.Props<D>) {
    invariant(oldProps.bridge === this.props.bridge, "bridge prop cannot be changed during Toolbar's lifetime.")
  }

  public render() {
    const dynamicStyles = { paddingHorizontal: this.computeIconSpacing() }
    return (
      <View style={[{ flexDirection: 'row', justifyContent: 'center' }, this.props.style]}>
        <View style={[[dynamicStyles, styles.container, this.props.contentContainerStyle]]}>
          {this.renderIconControlsMap()}
        </View>
      </View>
    )
  }
}

/**
 * Utility function to build {@link (Toolbar:type)} controls from {@link https://www.npmjs.com/package/react-native-vector-icons | react-native-vector-icons}.
 *
 * @param IconComponent - The icon {@link react#ComponentType} such as `MaterialCommunityIcons`
 * @param actionType - The control action performed when this control is actionated.
 * @param name - The name of the icon within the `IconComponent` set.
 *
 * @returns An object describing this control.
 *
 * @public
 */
export function buildVectorIconControlSpec<T extends Toolbar.VectorIconMinimalProps>(
  IconComponent: ComponentType<T & Toolbar.TextControlMinimalIconProps>,
  actionType: ControlAction,
  name: string,
): Toolbar.ControlSpec<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconProps: any = { name }
  const specs: Toolbar.ControlSpec<T> = {
    actionType,
    iconProps,
    IconComponent,
  }
  return specs
}

/**
 * A component to let user control the {@link (Sheet:type)} through a {@link (Bridge:class)}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
type Toolbar<D extends Bridge.MinimalImageProps> = ComponentClass<Toolbar.Props<D>>

const Toolbar = _Toolbar as Toolbar<any>

export { Toolbar }
