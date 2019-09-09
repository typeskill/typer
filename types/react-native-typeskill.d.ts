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
 * - The {@link (Typer:type)} component, a support for editing {@link (Document:type)}.
 * - The {@link (Print:type)} component, a display for {@link (Document:type)}.
 * - The {@link (Toolbar:type)} component, which permits text transforms on current selection.
 *
 * **Triggering actions from external controls**
 *
 * A {@link (Bridge:class)} instance should be shared between a {@link (Typer:type)} and any controlling component such as {@link (Toolbar:type)}.
 * Actions can be triggered with the help of the object returned by {@link (Bridge:class).getControlEventDomain}.
 *
 * Such actions include:
 *
 * - inserting media content;
 * - (un)setting text attributes (bold, italic).
 *
 * Selection change events can also be listened to with `add...Listener` methods.
 * {@link (Bridge:class).release} must be call from the component holding a reference to the {@link (Bridge:class)} instance,
 * during `componentWillUnmount` hook.
 *
 * @packageDocumentation
 */

import { ComponentClass } from 'react';
import { ComponentType } from 'react';
import React from 'react';
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
 * A set of definitions related to the {@link (Bridge:class)} class.
 *
 * @public
 */
export declare namespace Bridge {
    /**
     * An event which signals the intent to modify the content touched by current selection.
     */
    export type ControlEvent = 'APPLY_ATTRIBUTES_TO_SELECTION' | 'APPLY_LINE_TYPE_TO_SELECTION' | 'INSERT_OR_REPLACE_AT_SELECTION';
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
     * An object representing an area of events happening inside the {@link (Typer:type)}.
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
 * An abstraction responsible for event dispatching between the {@link (Typer:type)} and external controls.
 *
 * @remarks It also provide a uniform access to custom rendering logic.
 *
 * @internalRemarks
 *
 * The implemententation is isolated and decoupled from the {@link (Typer:type)} class.
 *
 * @public
 */
export declare class Bridge<ImageSource> {
    private outerEndpoint;
    private genService;
    private controlEventDom;
    private sheetEventDom;
    /**
     * @param genConfig - A configuration object describing content generation behaviors.
     */
    constructor(genConfig?: Partial<Gen.Config<ImageSource>>);
    /**
     * Get {@link (Bridge:namespace).SheetEventDomain | sheetEventDom}.
     *
     * @internal
     */
    getSheetEventDomain(): Bridge.SheetEventDomain<ImageSource>;
    /**
     * Get this bridge {@link (Bridge:namespace).ControlEventDomain}.
     *
     * @remarks
     *
     * The returned object can be used to react from and trigger {@link (Typer:type)} events.
     */
    getControlEventDomain(): Bridge.ControlEventDomain<ImageSource>;
    /**
     * @returns The gen service, responsible for content generation.
     */
    getGenService(): Gen.Service<ImageSource>;
    /**
     * End of the bridge's lifecycle.
     *
     * @remarks
     *
     * One would typically call this method during `componentWillUnmout` hook.
     */
    release(): void;
}

/**
 * Build the initial document content.
 *
 * @public
 */
export declare function buildInitialDocContent(): Document;

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
export declare function buildVectorIconControlSpec<T extends Toolbar.VectorIconMinimalProps>(IconComponent: ComponentType<T & Toolbar.TextControlMinimalIconProps>, actionType: ControlAction, name: string): Toolbar.ControlSpec<T>;

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
 * Actions which can be triggered with the {@link (Toolbar:type)} component.
 *
 * @public
 */
export declare enum ControlAction {
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
 * @public
 */
export declare const defaultImageLocator: Images.LocationService<Images.StandardSource>;

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
}

/**
 * A generic interface for components displaying {@link Document | document}.
 *
 * @public
 */
export declare interface DocumentRendererProps<ImageSource> {
    /**
     * The {@link (Bridge:class)} instance.
     *
     * @remarks This property MUST NOT be changed after instantiation.
     */
    bridge: Bridge<ImageSource>;
    /**
     * The {@link Document | document} to display.
     */
    document: Document;
    /**
     * Component styles.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Default text style.
     */
    textStyle?: StyleProp<TextStyle>;
    /**
     * The max width of a media block.
     *
     * @remarks If the container width is smaller then this width, the first will be used to frame media.
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
     * - between two adjacent blocks;
     * - to add padding between the container and the rendered document.
     */
    spacing?: number;
    /**
     * Style applied to the content container.
     *
     * @remarks This prop MUST NOT contain padding or margin rules. Such spacing rules will be zero-ed.
     * Apply padding to the {@link DocumentRendererProps.style | `style`} prop instead.
     */
    contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * A set of definitions related to rich content generation.
 *
 * @public
 */
export declare namespace Gen {
    /**
     * An object defining custom rendering behaviors.
     *
     * @public
     */
    export interface Config<ImageSource> {
        /**
         * A list of {@link (Transforms:namespace).GenericSpec | specs} which will be used to map text attributes with styles.
         */
        textTransformSpecs: Transforms.GenericSpec<Attributes.TextValue, 'text'>[];
        /**
         * An object describing the behavior to locate and render images.
         *
         * @remarks Were this parameter not provided, images interactions will be disabled in the related {@link (Typer:type)}.
         */
        imageLocatorService: Images.LocationService<ImageSource>;
    }
    /**
     * A service providing rendering behviors.
     */
    export interface Service<ImageSource> {
        imageLocator: Images.LocationService<ImageSource>;
        textTransforms: Transforms;
    }
}

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
    export interface LocationService<Source> {
        /**
         * The image component to render.
         *
         * @remarks The component MUST fit within the provided dimensions properties.
         */
        readonly Component: ComponentType<ComponentProps<Source>>;
        /**
         * An async function that returns a promise resolving to the description of an image.
         */
        readonly pickOneImage: () => Promise<Description<Source>>;
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
 * A set of definitions relative to {@link (Print:type)} component.

 * @public
 */
export declare namespace Print {
    /**
     * {@link (Print:type)} properties.
     */
    export type Props = DocumentRendererProps<any>;
}

/**
 * A component solely responsible for viewing {@link Document | document}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
export declare type Print = ComponentClass<Print.Props>;

export declare const Print: React.ComponentClass<DocumentRendererProps<any>, any>;

/**
 * A serializable object representing a selection of items in the {@link (Typer:type)}.
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
 * An operation containing text.
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
 * A set of definitions related to the {@link (Toolbar:type)} component.
 *
 * @public
 */
export declare namespace Toolbar {
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
        IconComponent: ComponentType<TextControlMinimalIconProps & T>;
        /**
         * The action performed when the control is actionated.
         */
        actionType: ControlAction;
        /**
         * The props passed to `IconComponent`
         */
        iconProps?: T extends Toolbar.VectorIconMinimalProps ? Toolbar.VectorIconMinimalProps : Partial<T>;
    }
    /**
     * Declaratively describes the layout of the {@link (Toolbar:type)} component.
     */
    export type Layout = (ControlSpec<any> | typeof CONTROL_SEPARATOR)[];
    /**
     * Props of the {@link (Toolbar:type)} component.
     */
    export interface Props<ImageSource> {
        /**
         * The instance to be shared with the {@link (Typer:type)}.
         */
        bridge: Bridge<ImageSource>;
        /**
         * The attributes actives in selection.
         *
         * @remarks You should provide those of your {@link Document | document} instance.
         */
        selectedTextAttributes: Attributes.Map;
        /**
         * A callback fired when inserting an image results in an error.
         */
        onInsertImageError?: (e: Error) => void;
        /**
         * An array describing the resulting layout of this component.
         */
        layout: Layout;
        /**
         * Button background when a control is not in active state.
         */
        inactiveButtonBackgroundColor?: string;
        /**
         * Button icon color when a control is not in active state.
         */
        inactiveButtonColor?: string;
        /**
         * Button icon color when a control is in active state.
         */
        activeButtonBackgroundColor?: string;
        /**
         * Button background when a control is in active state.
         */
        activeButtonColor?: string;
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
         * Icon size.
         */
        iconSize?: number;
        /**
         * The space between two buttons.
         */
        buttonSpacing?: number;
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
 * A component to let user control the {@link (Typer:type)} through a {@link (Bridge:class)}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
export declare type Toolbar = ComponentClass<Toolbar.Props<any>>;

export declare const Toolbar: React.ComponentClass<Toolbar.Props<any>, any>;

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
 * A set of definitions relative to {@link (Typer:type)} component.
 *
 * @public
 */
export declare namespace Typer {
    /**
     * {@link (Typer:type)} properties.
     */
    export interface Props extends DocumentRendererProps<any> {
        /**
         * Handler to receive {@link Document| document} updates.
         *
         * @remarks This callback is expected to return a promise. This promise MUST resolve when the update had been proceeded.
         */
        onDocumentUpdate?: (nextDocumentContent: Document) => Promise<void>;
        /**
         * Customize the color of image controls upon activation.
         */
        underlayColor?: string;
        /**
         * In debug mode, active block will be highlighted.
         */
        debug?: boolean;
        /**
         * Disable edition.
         */
        readonly?: boolean;
    }
}

/**
 * A component solely responsible for editing {@link Document | document}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
export declare type Typer = ComponentClass<Typer.Props>;

export declare const Typer: React.ComponentClass<Typer.Props, any>;

export { }
