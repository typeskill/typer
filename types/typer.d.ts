/**
 *
 * Typeskill, the Operational-Transform Based (React) Native Rich Text library.
 *
 * @remarks
 *
 * **Introduction**
 *
 * The library exposes:
 *
 * - The {@link (Typer:class)} component, a support for editing {@link (Document:type)};
 * - The {@link (Print:type)} component, a display for {@link (Document:type)};
 * - The {@link (Toolbar:class)} component, which permits text transforms on current selection.
 *
 * **Controlled components**
 *
 * {@link (Typer:class)} and {@link (Print:type)} components are [controlled components](https://reactjs.org/docs/forms.html#controlled-components).
 * You need to pass them a {@link Document | `document`} prop which you can initialize with {@link buildEmptyDocument}.
 *
 * **Triggering actions from external controls**
 *
 * A {@link (Bridge:interface)} instance must be shared between a {@link (Typer:class)} and any control component such as {@link (Toolbar:class)}.
 * The {@link (Bridge:interface)} instance can be instantiated with {@link buildBridge}.
 * Actions can be triggered with the help of the object returned by {@link (Bridge:interface).getControlEventDomain}.
 *
 * Such actions include:
 *
 * - inserting media content;
 * - (un)setting text attributes (bold, italic).
 *
 * Selection change events can also be listened to with `add...Listener` methods.
 * {@link (Bridge:interface).release} must be call from the component holding a reference to the {@link (Bridge:interface)} instance,
 * during `componentWillUnmount` hook.
 *
 * @packageDocumentation
 */

/// <reference types="react" />
import { Component } from 'react';
import { ComponentType } from 'react';
import { FunctionComponent } from 'react';
import { ScrollViewProps } from 'react-native';
import { StyleProp } from 'react-native';
import { TextStyle } from 'react-native';
import { ViewStyle } from 'react-native';

/**
 * A set of definitions for {@link GenericOp} attributes.
 *
 * @public
 */
export declare namespace Attributes {
    /**
     * Possible values for a text transform.
     *
     * @public
     */
    export type TextValue = boolean | string | number | null;
    /**
     * An attribute value.
     *
     * @public
     */
    export type GenericValue = object | TextValue | undefined;
    /**
     * A set of attributes applying to a {@link GenericOp}.
     *
     * @public
     */
    export interface Map {
        readonly [k: string]: GenericValue;
    }
    /**
     * A special text attribute value applied to a whole line.
     *
     * @remarks
     *
     * There can be only one text line type attribute active at once.
     *
     * @public
     */
    export type LineType = 'normal' | 'quoted';
}

/**
 * An operation referring to a block.
 *
 * @public
 */
export declare interface BlockOp<T extends object> extends GenericOp {
    /**
     * {@inheritdoc GenericOp.insert}
     */
    readonly insert: T;
    /**
     * {@inheritdoc GenericOp.attributes}
     */
    readonly attributes?: Attributes.Map;
}

/**
 * A set of definitions related to the {@link (Bridge:interface)} interface.
 *
 * @public
 */
export declare namespace Bridge {
    /**
     * An event which signals the intent to modify the content touched by current selection.
     */
    export type ControlEvent = 'APPLY_ATTRIBUTES_TO_SELECTION' | 'INSERT_OR_REPLACE_AT_SELECTION';
    /**
     * Block content to insert.
     */
    export interface ImageElement<Source> {
        type: 'image';
        description: Images.Description<Source>;
    }
    export interface TextElement {
        type: 'text';
        content: string;
    }
    /**
     * Content to insert.
     */
    export type Element<ImageSource> = ImageElement<ImageSource> | TextElement;
    /**
     * Listener to selected text attributes changes.
     */
    export type SelectedAttributesChangeListener = (selectedAttributes: Attributes.Map) => void;
    /**
     * Listener to attribute overrides.
     *
     */
    export type AttributesOverrideListener = (attributeName: string, attributeValue: Attributes.GenericValue) => void;
    /**
     * Listener to line type overrides.
     *
     */
    export type LineTypeOverrideListener = (lineType: Attributes.LineType) => void;
    /**
     *
     * @internal
     */
    export type InsertOrReplaceAtSelectionListener<ImageSource> = <D extends {}>(element: Element<ImageSource>) => void;
    /**
     * An object representing an area of events happening by the mean of external controls.
     *
     * @remarks
     *
     * This object exposes methods to trigger such events, and react to internal events.
     */
    export interface ControlEventDomain<ImageSource> {
        /**
         * Insert an element at cursor or replace if selection exists.
         *
         * @internal
         */
        insertOrReplaceAtSelection: (element: Element<ImageSource>) => void;
        /**
         * Switch the given attribute's value depending on the current selection.
         *
         * @param attributeName - The name of the attribute to edit.
         * @param attributeValue - The value of the attribute to edit. Assigning `null` clears any former truthy value.
         */
        applyTextTransformToSelection: (attributeName: string, attributeValue: Attributes.TextValue) => void;
    }
    /**
     * An object representing an area of events happening inside the {@link (Typer:class)}.
     *
     * @privateRemarks
     *
     * This object exposes methods to trigger such events, and react to external events.
     *
     * @internal
     */
    export interface SheetEventDomain<ImageSource> {
        /**
         * Listen to text attributes alterations in selection.
         */
        addApplyTextTransformToSelectionListener: (owner: object, listener: AttributesOverrideListener) => void;
        /**
         * Listen to insertions of text or blocks at selection.
         */
        addInsertOrReplaceAtSelectionListener: (owner: object, listener: InsertOrReplaceAtSelectionListener<ImageSource>) => void;
        /**
         * Dereference all listeners registered for this owner.
         */
        release: (owner: object) => void;
    }
}

/**
 * An abstraction responsible for event dispatching between the {@link (Typer:class)} and external controls.
 *
 * @remarks It also provide a uniform access to custom rendering logic.
 *
 * @internalRemarks
 *
 * We are only exporting the type to force consumers to use the build function.
 *
 * @public
 */
export declare interface Bridge<ImageSource> {
    /**
     * Get {@link (Bridge:namespace).SheetEventDomain | sheetEventDom}.
     *
     * @internal
     */
    getSheetEventDomain: () => Bridge.SheetEventDomain<ImageSource>;
    /**
     * Get this bridge {@link (Bridge:namespace).ControlEventDomain}.
     *
     * @remarks
     *
     * The returned object can be used to react from and trigger {@link (Typer:class)} events.
     */
    getControlEventDomain: () => Bridge.ControlEventDomain<ImageSource>;
    /**
     * End of the bridge's lifecycle.
     *
     * @remarks
     *
     * One would typically call this method during `componentWillUnmout` hook.
     */
    release: () => void;
}

export declare const Bridge: {};

/**
 * Build a bridge instance.
 *
 * @public
 */
export declare function buildBridge<ImageSource = Images.StandardSource>(): Bridge<ImageSource>;

/**
 * Build an empty document.
 *
 * @public
 */
export declare function buildEmptyDocument(): Document;

/**
 * Utility function to build {@link (Toolbar:class)} controls from {@link https://www.npmjs.com/package/react-native-vector-icons | react-native-vector-icons}.
 *
 * @param IconComponent - The icon {@link react#ComponentType} such as `MaterialCommunityIcons`
 * @param actionType - The control action performed when this control is actionated.
 * @param name - The name of the icon within the `IconComponent` set.
 *
 * @returns An object describing this control.
 *
 * @public
 */
export declare function buildVectorIconControlSpec<A extends GenericControlAction, T extends Toolbar.VectorIconMinimalProps>(IconComponent: ComponentType<T & Toolbar.TextControlMinimalIconProps>, actionType: A, name: string, options?: Pick<Toolbar.GenericControlSpec<A, T>, 'actionOptions' | 'iconProps'>): Toolbar.GenericControlSpec<A, T>;

/**
 * Clone a peace of {@link Document | document}.
 *
 * @param content - The content to clone
 *
 * @public
 */
export declare function cloneDocument(content: Document): Document;

/**
 * Constant used within a {@link (Toolbar:namespace).Layout} to denote a separator.
 *
 * @public
 */
export declare const CONTROL_SEPARATOR: unique symbol;

/**
 * @public
 */
export declare const defaultTextTransforms: Transforms.GenericSpec<Attributes.TextValue, 'text'>[];

/**
 * A serializable object representing rich content.
 *
 * @public
 */
export declare interface Document {
    /**
     * A list of operations as per deltajs definition.
     */
    readonly ops: GenericOp[];
    /**
     * A contiguous range of selectable items.
     */
    readonly currentSelection: SelectionShape;
    /**
     * The attributes encompassed by {@link Document.currentSelection} or the attributes at cursor.
     * `null` values represent attributes to be removed.
     */
    readonly selectedTextAttributes: Attributes.Map;
    /**
     * The diff ops which were used to produce current ops by combining previous ops.
     */
    readonly lastDiff: GenericOp[];
    /**
     * The document shape versionning.
     *
     * @remarks This attribute might only change between major releases, and is intended to very rarely change.
     * It is also guaranteed that if there were any, the library would offer tools to handle schema migrations.
     *
     */
    readonly schemaVersion: number;
}

/**
 * Actions which can be triggered with the {@link (Toolbar:class)} component to alter document.
 *
 * @public
 */
export declare enum DocumentControlAction {
    /**
     * Switch bold formatting in the selected text.
     */
    SELECT_TEXT_BOLD = 0,
    /**
     * Switch italic formatting in the selected text.
     */
    SELECT_TEXT_ITALIC = 1,
    /**
     * Switch underline formatting in the selected text.
     */
    SELECT_TEXT_UNDERLINE = 2,
    /**
     * Switch strikethrough formatting in the selected text.
     */
    SELECT_TEXT_STRIKETHROUGH = 3,
    /**
     * Insert an image at selection.
     */
    INSERT_IMAGE_AT_SELECTION = 4
}

/**
 * A generic interface for components displaying {@link Document | document}.
 *
 * @remarks There are 3 styles props:
 *
 * ```
 * +------------------------------+
 * | style (ScrollView)           |
 * | +--------------------------+ |
 * | | contentContainerStyle    | |
 * | | +----------------------+ | |
 * | | | documentStyle        | | |
 * | | |                      | | |
 * ```
 *
 * @public
 */
export declare interface DocumentRendererProps<ImageSource> {
    /**
     * The {@link Document | document} to display.
     */
    document: Document;
    /**
     * The image component to render.
     *
     * @remarks The component MUST fit within the passed {@link Images.ComponentProps.printDimensions} prop.
     */
    ImageComponent?: Images.Component<ImageSource>;
    /**
     * A collection of text transforms.
     */
    textTransformSpecs?: Transforms.Specs<'text'>;
    /**
     * Default text style.
     */
    textStyle?: StyleProp<TextStyle>;
    /**
     * The max width of a media block.
     *
     * @remarks If the container width is smaller than this width, the first will be used to frame media.
     */
    maxMediaBlockWidth?: number;
    /**
     * The max height of a media block.
     */
    maxMediaBlockHeight?: number;
    /**
     * The spacing unit.
     *
     * @remarks It is used:
     *
     * - Between two adjacent blocks;
     * - Between container and document print.
     */
    spacing?: number;
    /**
     * Component style.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Style applied to the content container.
     *
     * @remarks This prop MUST NOT contain padding or margin rules. Such spacing rules will be zero-ed.
     * Instead, {@link DocumentRendererProps.spacing | `spacing`} prop will add spacing between the edge of the scrollview and container.
     */
    contentContainerStyle?: StyleProp<ViewStyle>;
    /**
     * Styles applied to the closest view encompassing rich content.
     *
     * @remarks This prop MUST NOT contain padding rules. Such padding rules will be zero-ed. Instead, use margin rules.
     */
    documentStyle?: StyleProp<ViewStyle>;
    /**
     * Any {@link react-native#ScrollView} props you wish to pass.
     *
     * @remarks
     *
     * - Do not pass `style` prop as it will be overriden by this component `style` props;
     * - Do not pass `keyboardShouldPersistTaps` because it will be forced to `"always"`.
     */
    scrollViewProps?: ScrollViewProps;
    /**
     * The component to replace RN default {@link react-native#ScrollView}.
     */
    ScrollView?: ComponentType<any>;
}

/**
 * @public
 */
export declare interface FocusableInput {
    /**
     * Focus programatically.
     */
    focus: () => void;
}

/**
 * Any actions which can be triggered with the {@link (Toolbar:class)} component.
 *
 * @public
 */
export declare type GenericControlAction = string | symbol | number;

/**
 * An atomic operation representing changes to a document.
 *
 * @remarks
 *
 * This interface is a redefinition of {@link quilljs-delta#Op}.
 *
 * @public
 */
export declare interface GenericOp {
    /**
     * A representation of inserted content.
     */
    readonly insert?: string | object;
    /**
     * A delete operation.
     *
     * @internal
     */
    readonly delete?: number;
    /**
     * A retain operation
     *
     * @internal
     */
    readonly retain?: number;
    /**
     * A set of attributes describing properties of the content.
     */
    readonly attributes?: Attributes.Map;
}

/**
 * A generic interface for instances describing rich content.
 *
 * @public
 */
export declare interface GenericRichContent {
    /**
     * An array of operations.
     */
    readonly ops: GenericOp[];
    /**
     * @returns The length of the underlying rich text representation.
     * This length represents the number of cursor positions in the document.
     */
    readonly length: () => number;
}

/**
 * A description of an image to be persisted in the document.
 *
 * @public
 */
export declare interface ImageKind<Source> extends Images.Description<Source> {
    kind: 'image';
}

/**
 * An operation referring to an image.
 *
 * @public
 */
export declare type ImageOp<Source> = BlockOp<ImageKind<Source>>;

/**
 * A set of definitions related to images.
 *
 * @public
 */
export declare namespace Images {
    export interface StandardSource {
        uri: string;
    }
    export interface Description<Source> {
        readonly source: Source;
        readonly width: number;
        readonly height: number;
    }
    export interface Dimensions {
        readonly width: number;
        readonly height: number;
    }
    export type Component<Source> = ComponentType<ComponentProps<Source>>;
    export interface ComponentProps<Source> {
        /**
         * The dimensions this component MUST occupy.
         */
        readonly printDimensions: Dimensions;
        /**
         * The image description.
         */
        readonly description: Description<Source>;
    }
    /**
     * An object used to locate and render images.
     */
    export interface Hooks<Source> {
        /**
         * Callback fired when an image has been successfully inserted.
         */
        readonly onImageAddedEvent?: (description: Description<Source>) => void;
        /**
         * Callback fired when an image has been removed.
         */
        readonly onImageRemovedEvent?: (description: Description<Source>) => void;
    }
}

/**
 * A set of definitions relative to {@link (Print:class)} component.

 * @public
 */
export declare namespace Print {
    /**
     * {@link (Print:class)} properties.
     */
    export type Props<ImageSource> = DocumentRendererProps<ImageSource>;
}

/**
 * A component solely responsible for viewing {@link Document | document}.
 *
 * @public
 *
 */
export declare class Print<ImageSource = Images.StandardSource> extends Component<Print.Props<ImageSource>> {
}

/**
 * A serializable object representing a selection of items in the {@link (Typer:class)}.
 *
 * @public
 */
export declare interface SelectionShape {
    /**
     * **Inclusive** first item index in selection.
     */
    readonly start: number;
    /**
     * **Exclusive** last item index in selection.
     */
    readonly end: number;
}

/**
 * An operation referring to text.
 *
 * @public
 */
export declare interface TextOp extends GenericOp {
    /**
     * {@inheritdoc GenericOp.insert}
     */
    readonly insert?: string;
    /**
     * {@inheritdoc GenericOp.attributes}
     */
    readonly attributes?: Attributes.Map;
}

/**
 * A set of definitions related to the {@link (Toolbar:class)} component.
 *
 * @public
 */
export declare namespace Toolbar {
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
        IconComponent: ComponentType<TextControlMinimalIconProps & T>;
        /**
         * The action performed when the control is actionated.
         */
        actionType: A;
        /**
         * Any value to be passed to action hook.
         */
        actionOptions?: any;
        /**
         * The props passed to `IconComponent`
         */
        iconProps?: T extends Toolbar.VectorIconMinimalProps ? Toolbar.VectorIconMinimalProps : Partial<T>;
    }
    /**
     * An object describing a control which alter the document.
     */
    export type DocumentControlSpec<T extends object = {}> = GenericControlSpec<DocumentControlAction, T>;
    /**
     * Declaratively describes the layout of the {@link (Toolbar:class)} component.
     */
    export type Layout = (DocumentControlSpec<any> | typeof CONTROL_SEPARATOR | GenericControlSpec<any, any>)[];
    export interface IconButtonSpecs {
        /**
         * Button background when a control is not in active state.
         */
        inactiveButtonBackgroundColor: string;
        /**
         * Button icon color when a control is not in active state.
         */
        inactiveButtonColor: string;
        /**
         * Button icon color when a control is in active state.
         */
        activeButtonBackgroundColor: string;
        /**
         * Button background when a control is in active state.
         */
        activeButtonColor: string;
        /**
         * Icon size.
         */
        iconSize: number;
    }
    /**
     * Props of the {@link (Toolbar:class)} component.
     */
    export interface Props<ImageSource, ImageOptions = any> extends Partial<IconButtonSpecs> {
        /**
         * The instance to be shared with the {@link (Typer:class)}.
         */
        bridge: Bridge<ImageSource>;
        /**
         * The {@link Document | document}.
         */
        document: Document;
        /**
         * An array describing the resulting layout of this component.
         */
        layout: Layout;
        /**
         * An async function that returns a promise resolving to the {@link Images.Description | description} of an image.
         *
         * @remarks The corresponding {@link (Toolbar:namespace).GenericControlSpec.actionOptions} will be passed to this function.
         */
        pickOneImage?: (options?: ImageOptions) => Promise<Images.Description<ImageSource>>;
        /**
         * A callback fired when pressing a custom control.
         */
        onPressCustomControl?: <A extends GenericControlAction>(actionType: A, actionOptions?: any) => void;
        /**
         * A callback fired when inserting an image results in an error.
         */
        onInsertImageError?: (e: Error) => void;
        /**
         * The color of the separator.
         *
         * @remarks
         *
         * A separator can be defined by inserting {@link CONTROL_SEPARATOR} constant to the `layout` prop.
         */
        separatorColor?: string;
        /**
         * Style of the root component.
         */
        style?: StyleProp<ViewStyle>;
        /**
         * Style of the container component encompassing all controls.
         */
        contentContainerStyle?: StyleProp<ViewStyle>;
        /**
         * The space between two buttons.
         */
        buttonSpacing?: number;
    }
    /**
     * Props for {@link (Toolbar:class).IconButton} component.
     */
    export interface IconButtonProps extends IconButtonSpecs {
        selected: boolean;
        IconComponent: ComponentType<TextControlMinimalIconProps>;
        onPress?: () => void;
        style?: StyleProp<ViewStyle>;
        iconProps?: object;
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
        color?: string;
        /**
         * Icon size.
         */
        size?: number;
    }
    /**
     * The shape of expected props to an icon from {@link https://www.npmjs.com/package/react-native-vector-icons | react-native-vector-icons}.
     */
    export interface VectorIconMinimalProps {
        /**
         * Icon name.
         */
        name: string;
    }
}

/**
 * A component to let user control the {@link (Typer:class)} through a {@link (Bridge:interface)}.
 *
 * @public
 */
export declare class Toolbar<ImageSource = Images.StandardSource, ImageOptions = any> extends Component<Toolbar.Props<ImageSource, ImageOptions>> {
    /**
     * A button component displayed inside a toolbar.
     */
    IconButton: FunctionComponent<Toolbar.IconButtonProps>;
}

/**
 * A set of definitions related to text and arbitrary content transforms.
 *
 * @public
 */
export declare namespace Transforms {
    /**
     * The target type of a transform.
     */
    export type TargetType = 'block' | 'text';
    /**
     * A {@link (Transforms:namespace).GenericSpec} which `attributeActiveValue` is `true`.
     *
     * @public
     */
    export type BoolSpec<T extends TargetType = 'block'> = GenericSpec<true, T>;
    /**
     * A mapping of attribute names with their corresponding transformation description.
     *
     * @internal
     */
    export interface Dict<A extends Attributes.GenericValue, T extends TargetType> {
        [attributeName: string]: GenericSpec<A, T>[];
    }
    /**
     * Default text attributes names.
     *
     * @public
     */
    export type TextAttributeName = 'bold' | 'italic' | 'textDecoration';
    /**
     * Description of a generic transform.
     *
     * @public
     */
    export interface GenericSpec<A extends Attributes.GenericValue, T extends TargetType> {
        /**
         * The name of the attribute.
         *
         * @remarks
         *
         * Multiple {@link (Transforms:namespace).GenericSpec} can share the same `attributeName`.
         */
        attributeName: string;
        /**
         * The value of the attribute when this transform is active.
         */
        activeAttributeValue: A;
        /**
         * The style applied to the target block when this transform is active.
         */
        activeStyle: T extends 'block' ? ViewStyle : TextStyle;
    }
    export type Specs<T extends 'text' | 'block' = 'text'> = GenericSpec<Attributes.TextValue, T>[];
}

/**
 * An entity which responsibility is to provide styles from text transforms.
 *
 * @public
 */
export declare class Transforms {
    private textTransformsDict;
    constructor(textTransformSpecs: Transforms.GenericSpec<Attributes.TextValue, 'text'>[]);
    /**
     * Produce react styles from a text operation.
     *
     * @param op - text op.
     *
     * @internal
     */
    getStylesFromOp(op: TextOp): StyleProp<TextStyle>;
}

/**
 * A set of definitions relative to {@link (Typer:class)} component.
 *
 * @public
 */
export declare namespace Typer {
    /**
     * {@link (Typer:class)} properties.
     */
    export interface Props<ImageSource> extends DocumentRendererProps<ImageSource> {
        /**
         * The {@link (Bridge:interface)} instance.
         *
         * @remarks This property MUST NOT be changed after instantiation.
         */
        bridge: Bridge<ImageSource>;
        /**
         * Callbacks on image insertion and deletion.
         */
        imageHooks?: Images.Hooks<ImageSource>;
        /**
         * Handler to receive {@link Document| document} updates.
         *
         */
        onDocumentUpdate?: (nextDocumentContent: Document) => void;
        /**
         * Disable edition.
         */
        readonly?: boolean;
        /**
         * Customize the color of image controls upon activation.
         */
        underlayColor?: string;
        /**
         * In debug mode, active block will be highlighted.
         */
        debug?: boolean;
        /**
         * Disable selection overrides.
         *
         * @remarks
         *
         * In some instances, the typer will override active text selections. This will happen when user press the edge of a media block:
         * the selection will be overriden in order to select the preceding or following text input closest selectable unit.
         *
         * However, some versions of React Native have an Android bug which can trigger a `setSpan` error. If such errors occur, you should disable selection overrides.
         * {@link https://github.com/facebook/react-native/issues/25265}
         * {@link https://github.com/facebook/react-native/issues/17236}
         * {@link https://github.com/facebook/react-native/issues/18316}
         */
        disableSelectionOverrides?: boolean;
        /**
         * By default, when user select text and apply transforms, the selection will be overriden to stay the same and allow user to apply multiple transforms.
         * This is the normal behavior on iOS, but not on Android. Typeksill will by default enforce this behavior on Android too.
         * However, when this prop is set to `true`, such behavior will be prevented on Android.
         */
        androidDisableMultipleAttributeEdits?: boolean;
    }
}

/**
 * A component solely responsible for editing {@link Document | document}.
 *
 * @remarks This component is [controlled](https://reactjs.org/docs/forms.html#controlled-components).
 *
 * You MUST provide:
 *
 * - A {@link Document | `document`} prop to render contents. You can initialize it with {@link buildEmptyDocument};
 * - A {@link (Bridge:interface) | `bridge` } prop to share document-related events with external controls;
 *
 * You SHOULD provide:
 *
 * - A `onDocumentUpdate` prop to update its state.
 *
 * @public
 *
 */
export declare class Typer<ImageSource = Images.StandardSource> extends Component<Typer.Props<ImageSource>> implements FocusableInput {
    focus: () => void;
}

/**
 * React hook which returns a bridge.
 *
 * @remarks One bridge instance should exist for one document renderer instance.
 * @param deps - A list of values which should trigger, on change, the creation of a new {@link (Bridge:interface)} instance.
 * @public
 */
export declare function useBridge<ImageSource = Images.StandardSource>(deps?: unknown[]): Bridge<ImageSource>;

/**
 * React hook to store and update the document.
 *
 * @remarks If you just need an initial document value, use {@link buildEmptyDocument} instead.
 *
 * @param initialDocument - The initial value.
 * @public
 */
export declare function useDocument(initialDocument?: Document): [Document, import("react").Dispatch<import("react").SetStateAction<Document>>];

export { }
