import React, { PureComponent, SFC, ComponentType, Component, FunctionComponent } from 'react'
import { View, TouchableOpacity, StyleProp, ViewStyle, ViewPropTypes, StyleSheet } from 'react-native'
import invariant from 'invariant'
import PropTypes from 'prop-types'
import { Transforms } from '@core/Transforms'
import { BridgeStatic, Bridge } from '@core/Bridge'
import { Attributes } from '@delta/attributes'
import { ToolbarLayoutPropType, DocumentPropType } from './types'
import { Images } from '@core/Images'
import { Document } from '@model/document'
import identity from 'ramda/es/identity'
import partial from 'ramda/es/partial'

/**
 * Constant used within a {@link (Toolbar:namespace).Layout} to denote a separator.
 *
 * @public
 */
export const CONTROL_SEPARATOR = Symbol('separator')

/**
 * Any actions which can be triggered with the {@link (Toolbar:interface)} component.
 *
 * @public
 */
export type GenericControlAction = string | symbol | number

/**
 * Actions which can be triggered with the {@link (Toolbar:interface)} component to alter document.
 *
 * @public
 */
export enum DocumentControlAction {
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
 * A set of definitions related to the {@link (Toolbar:interface)} component.
 *
 * @public
 */
declare namespace Toolbar {
  export interface GenericControlSpec<A extends GenericControlAction, T extends object> {
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
    actionType: A
    /**
     * Any value to be passed to action hook.
     */
    actionOptions?: any
    /**
     * The props passed to `IconComponent`
     */
    iconProps?: T extends Toolbar.VectorIconMinimalProps ? Toolbar.VectorIconMinimalProps : Partial<T>
  }

  /**
   * An object describing a control which alter the document.
   */
  export type DocumentControlSpec<T extends object = {}> = GenericControlSpec<DocumentControlAction, T>
  /**
   * Declaratively describes the layout of the {@link (Toolbar:interface)} component.
   */
  export type Layout = (DocumentControlSpec<any> | typeof CONTROL_SEPARATOR | GenericControlSpec<any, any>)[]

  export interface IconButtonSpecs {
    /**
     * Button background when a control is not in active state.
     */
    inactiveButtonBackgroundColor: string
    /**
     * Button icon color when a control is not in active state.
     */
    inactiveButtonColor: string
    /**
     * Button icon color when a control is in active state.
     */
    activeButtonBackgroundColor: string
    /**
     * Button background when a control is in active state.
     */
    activeButtonColor: string
    /**
     * Icon size.
     */
    iconSize: number
  }

  /**
   * Props of the {@link (Toolbar:interface)} component.
   */
  export interface Props<ImageSource, ImageOptions = any> extends Partial<IconButtonSpecs> {
    /**
     * The instance to be shared with the {@link (Typer:interface)}.
     */
    bridge: Bridge<ImageSource>
    /**
     * The {@link Document | document}.
     */
    document: Document
    /**
     * An array describing the resulting layout of this component.
     */
    layout: Layout
    /**
     * An async function that returns a promise resolving to the {@link Images.Description | description} of an image.
     *
     * @remarks The corresponding {@link (Toolbar:namespace).GenericControlSpec.actionOptions} will be passed to this function.
     */
    pickOneImage?: (options?: ImageOptions) => Promise<Images.Description<ImageSource>>
    /**
     * A callback fired when pressing a custom control.
     */
    onPressCustomControl?: <A extends GenericControlAction>(actionType: A, actionOptions?: any) => void
    /**
     * A callback fired when inserting an image results in an error.
     */
    onInsertImageError?: (e: Error) => void

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
     * The space between two buttons.
     */
    buttonSpacing?: number
  }

  /**
   * Props for {@link (Toolbar:interface).IconButton} component.
   */
  export interface IconButtonProps extends IconButtonSpecs {
    selected: boolean
    IconComponent: ComponentType<TextControlMinimalIconProps>
    onPress?: () => void
    style?: StyleProp<ViewStyle>
    iconProps?: object
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
     * Will receive {@link (Toolbar:namespace).IconButtonSpecs.inactiveButtonColor} when not active and
     * {@link (Toolbar:namespace).IconButtonSpecs.activeButtonColor} when active.
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

const DEFAULT_ICON_SIZE = 24

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    flexDirection: 'row',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
})

function getDefaultButtonStyle({ inactiveButtonColor, inactiveButtonBackgroundColor }: Toolbar.IconButtonSpecs) {
  return {
    color: inactiveButtonColor,
    backgroundColor: inactiveButtonBackgroundColor,
  }
}

function getSelectedButtonStyle({ activeButtonColor, activeButtonBackgroundColor }: Toolbar.IconButtonSpecs) {
  return {
    color: activeButtonColor,
    backgroundColor: activeButtonBackgroundColor,
  }
}

// eslint-disable-next-line @typescript-eslint/class-name-casing
class _Toolbar extends PureComponent<Toolbar.Props<any, any>> {
  public static propTypes: Record<keyof Toolbar.Props<any>, any> = {
    bridge: PropTypes.instanceOf(BridgeStatic).isRequired,
    document: DocumentPropType,
    pickOneImage: PropTypes.func,
    onPressCustomControl: PropTypes.func,
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

  public static defaultProps: Partial<Record<keyof Toolbar.Props<any>, any>> = {
    inactiveButtonBackgroundColor: 'transparent',
    inactiveButtonColor: '#3a404c',
    activeButtonBackgroundColor: 'transparent',
    activeButtonColor: '#4286f4',
    separatorColor: '#646e82',
    iconSize: DEFAULT_ICON_SIZE,
  }

  public static IconButton: SFC<Toolbar.IconButtonProps> = ({
    onPress,
    selected,
    style,
    IconComponent,
    iconProps,
    ...buttonSpec
  }) => {
    const dynamicStyle = selected ? getSelectedButtonStyle(buttonSpec) : getDefaultButtonStyle(buttonSpec)
    return (
      <TouchableOpacity onPress={onPress} style={[dynamicStyle, style]}>
        <IconComponent color={dynamicStyle.color as string} size={buttonSpec.iconSize} {...iconProps} />
      </TouchableOpacity>
    )
  }

  private controlEventDom: Bridge.ControlEventDomain<any>

  public constructor(props: Toolbar.Props<any>) {
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
        marginRight: this.computeIconSpacing(),
      },
    })

  private async insertImageAtSelection(options?: any) {
    if (this.props.pickOneImage) {
      try {
        const description = await this.props.pickOneImage(options)
        this.controlEventDom.insertOrReplaceAtSelection({ type: 'image', description })
      } catch (e) {
        this.props.onInsertImageError && this.props.onInsertImageError(e)
      }
    } else {
      console.warn(`You didn't pass pickOneImage in ${Toolbar.name} component.`)
    }
  }

  private applyTextTransformToSelection(
    attributeName: Transforms.TextAttributeName,
    activeAttributeValue: Attributes.TextValue,
  ) {
    const currentTextAttribute = this.props.document.selectedTextAttributes[attributeName]
    const nextAttributeValue = currentTextAttribute === activeAttributeValue ? null : activeAttributeValue
    return () => {
      this.controlEventDom.applyTextTransformToSelection(attributeName, nextAttributeValue)
    }
  }

  private computeIconSpacing() {
    return typeof this.props.buttonSpacing === 'number' ? this.props.buttonSpacing : (this.props.iconSize as number) / 3
  }

  private getButtonSpecs(): Toolbar.IconButtonSpecs {
    const {
      iconSize,
      activeButtonBackgroundColor,
      activeButtonColor,
      inactiveButtonBackgroundColor,
      inactiveButtonColor,
    } = this.props
    return {
      iconSize: iconSize as number,
      activeButtonBackgroundColor: activeButtonBackgroundColor as string,
      activeButtonColor: activeButtonColor as string,
      inactiveButtonBackgroundColor: inactiveButtonBackgroundColor as string,
      inactiveButtonColor: inactiveButtonColor as string,
    }
  }

  private renderStatelessActionController(
    controlSpec: Toolbar.DocumentControlSpec,
    onPress: () => void,
    last: boolean,
  ) {
    const IconButton = _Toolbar.IconButton
    return (
      <IconButton
        {...this.getButtonSpecs()}
        selected={false}
        style={last ? undefined : { marginRight: this.computeIconSpacing() }}
        IconComponent={controlSpec.IconComponent}
        iconProps={controlSpec.iconProps}
        onPress={onPress}
      />
    )
  }

  private renderCustomController(controlSpec: Toolbar.GenericControlSpec<any, any>, last: boolean) {
    const onPressCustomControl = partial(this.props.onPressCustomControl || identity, [
      controlSpec.actionType,
      controlSpec.actionOptions,
    ]) as () => void
    return this.renderStatelessActionController(controlSpec, onPressCustomControl, last)
  }

  private renderInsertImageController(controlSpec: Toolbar.DocumentControlSpec, last: boolean) {
    return this.renderStatelessActionController(
      controlSpec,
      this.insertImageAtSelection.bind(this, controlSpec.actionOptions),
      last,
    )
  }

  private renderTextTransformController(
    attributeName: Transforms.TextAttributeName,
    activeAttributeValue: Attributes.TextValue,
    textControlSpec: Toolbar.DocumentControlSpec,
    last = false,
  ) {
    const {
      document: { selectedTextAttributes },
    } = this.props
    const IconButton = _Toolbar.IconButton
    return (
      <IconButton
        {...this.getButtonSpecs()}
        selected={selectedTextAttributes[attributeName] === activeAttributeValue}
        style={last ? undefined : { marginRight: this.computeIconSpacing() }}
        IconComponent={textControlSpec.IconComponent}
        iconProps={textControlSpec.iconProps}
        onPress={this.applyTextTransformToSelection(attributeName, activeAttributeValue)}
      />
    )
  }

  private renderIconControl(controlSpec: Toolbar.GenericControlSpec<DocumentControlAction | any, any>, last: boolean) {
    switch (controlSpec.actionType) {
      case DocumentControlAction.SELECT_TEXT_BOLD:
        return this.renderTextTransformController('bold', true, controlSpec, last)
      case DocumentControlAction.SELECT_TEXT_ITALIC:
        return this.renderTextTransformController('italic', true, controlSpec, last)
      case DocumentControlAction.SELECT_TEXT_UNDERLINE:
        return this.renderTextTransformController('textDecoration', 'underline', controlSpec, last)
      case DocumentControlAction.SELECT_TEXT_STRIKETHROUGH:
        return this.renderTextTransformController('textDecoration', 'strikethrough', controlSpec, last)
      case DocumentControlAction.INSERT_IMAGE_AT_SELECTION:
        return this.renderInsertImageController(controlSpec, last)
      default:
        return this.renderCustomController(controlSpec, last)
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

  public componentDidUpdate(oldProps: Toolbar.Props<any>) {
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
 * Utility function to build {@link (Toolbar:interface)} controls from {@link https://www.npmjs.com/package/react-native-vector-icons | react-native-vector-icons}.
 *
 * @param IconComponent - The icon {@link react#ComponentType} such as `MaterialCommunityIcons`
 * @param actionType - The control action performed when this control is actionated.
 * @param name - The name of the icon within the `IconComponent` set.
 *
 * @returns An object describing this control.
 *
 * @public
 */
export function buildVectorIconControlSpec<A extends GenericControlAction, T extends Toolbar.VectorIconMinimalProps>(
  IconComponent: ComponentType<T & Toolbar.TextControlMinimalIconProps>,
  actionType: A,
  name: string,
  options?: Pick<Toolbar.GenericControlSpec<A, T>, 'actionOptions' | 'iconProps'>,
): Toolbar.GenericControlSpec<A, T> {
  const iconProps: any = { name }
  const specs: Toolbar.GenericControlSpec<A, T> = {
    ...options,
    actionType,
    iconProps,
    IconComponent,
  }
  return specs
}

/**
 * A component to let user control the {@link (Typer:interface)} through a {@link (Bridge:interface)}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
interface Toolbar {
  new <ImageSource = Images.StandardSource, ImageOptions = any>(
    props: Toolbar.Props<ImageSource, ImageOptions>,
    context?: any,
  ): Component<Toolbar.Props<ImageSource, ImageOptions>>
  IconButton: FunctionComponent<Toolbar.IconButtonProps>
}

const Toolbar = _Toolbar as Toolbar

export { Toolbar }
