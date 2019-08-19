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
 * - The {@link (Sheet:type)} component, a support for editing {@link (RichContent:class)}.
 * - The {@link (RichText:class)} component, a display for {@link (RichContent:class)}.
 * - The {@link (Toolbar:type)} component, which permits text transforms on current selection.
 *
 * **Triggering actions from external controls**
 *
 * A {@link (Bridge:class)} instance should be shared between a {@link (Sheet:type)} and any controlling component such as {@link (Toolbar:type)}.
 * Actions can be triggered with the help of the object returned by {@link (Bridge:class).getControlEventDomain}.
 *
 * Such actions include:
 *
 * - inserting media content;
 * - switching line type (normal, lists);
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
     * An object used to locate and render images.
     */
    export interface ImageLocationService<D extends {}> {
        /**
         * The image component to render.
         */
        Component: ComponentType<D>;
        /**
         * An async function that returns the description of an image.
         */
        pickOneImage: () => Promise<D>;
        /**
         * Callback fired when an image has been successfully inserted.
         */
        onImageAddedEvent?: (description: D) => void;
        /**
         * Callback fired when an image has been removed through user interactions.
         */
        onImageRemovedEvent?: (description: D) => void;
    }
    export interface Config<D extends {}> {
        /**
         * A list of {@link (Transforms:namespace).GenericSpec | specs} which will be used to map text attributes with styles.
         */
        textTransformSpecs: Transforms.GenericSpec<Attributes.TextValue, 'text'>[];
        /**
         * An object describing the behavior to locate and render images.
         *
         * @remarks Were this parameter not provided, images interactions will be disabled in the related {@link (Sheet:type)}.
         */
        imageLocatorService: ImageLocationService<D>;
    }
    /**
     * An event which signals the intent to modify the content touched by current selection.
     */
    export type ControlEvent = 'APPLY_ATTRIBUTES_TO_SELECTION' | 'APPLY_LINE_TYPE_TO_SELECTION' | 'INSERT_OR_REPLACE_AT_SELECTION';
    /**
     * An event which informs from selection changes resulting from interactions happening within the {@link (Sheet:type)} component.
     */
    export type SheetEvent = 'SELECTED_ATTRIBUTES_CHANGE' | 'SELECTED_LINE_TYPE_CHANGE';
    /**
     * Block content to insert.
     */
    export interface ImageElement<D extends {}> {
        type: 'image';
        description: D;
    }
    export interface TextElement {
        type: 'text';
        content: string;
    }
    /**
     * Content to insert.
     */
    export type Element<D extends {}> = ImageElement<D> | TextElement;
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
    export type InsertOrReplaceAtSelectionListener = <D extends {}>(element: Element<D>) => void;
    /**
     * An object representing an area of events happening by the mean of external controls.
     *
     * @remarks
     *
     * This object exposes methods to trigger such events, and react to internal events.
     */
    export interface ControlEventDomain<D extends {}> {
        /**
         * Insert an element at cursor or replace if selection exists.
         *
         * @internal
         */
        insertOrReplaceAtSelection: (element: Element<D>) => void;
        /**
         * Switch the given attribute's value depending on the current selection.
         *
         * @param attributeName - The name of the attribute to edit.
         * @param attributeValue - The value of the attribute to edit. Assigning `null` clears any former truthy value.
         */
        applyTextTransformToSelection: (attributeName: string, attributeValue: Attributes.TextValue) => void;
        /**
         * Listen to attributes changes in selection.
         */
        addSelectedAttributesChangeListener: (owner: object, listener: SelectedAttributesChangeListener) => void;
        /**
         * Dereference all listeners registered for this owner.
         */
        release: (owner: object) => void;
    }
    /**
     * An object representing an area of events happening inside the {@link (Sheet:type)}.
     *
     * @privateRemarks
     *
     * This object exposes methods to trigger such events, and react to external events.
     *
     * @internal
     */
    export interface SheetEventDomain {
        /**
         * Listen to text attributes alterations in selection.
         */
        addApplyTextTransformToSelectionListener: (owner: object, listener: AttributesOverrideListener) => void;
        /**
         * Listen to insertions of text or blocks at selection.
         */
        addInsertOrReplaceAtSelectionListener: (owner: object, listener: InsertOrReplaceAtSelectionListener) => void;
        /**
         * Notify selected text attributes update.
         *
         */
        notifySelectedTextAttributesChange: (attributesMap: Attributes.Map) => void;
        /**
         * Notify selected line type update.
         *
         */
        notifySelectedLineTypeChange: (selectionLineType: Attributes.LineType) => void;
        /**
         * Dereference all listeners registered for this owner.
         */
        release: (owner: object) => void;
        getTransforms(): Transforms;
    }
}

/**
 * An abstraction responsible for event dispatching between the {@link (Sheet:type)} and external controls.
 *
 * @internalRemarks
 *
 * The implemententation is isolated and decoupled from the {@link (Sheet:type)} class.
 *
 * @public
 */
export declare class Bridge<D extends {} = {}> {
    private innerEndpoint;
    private outerEndpoint;
    private transforms;
    private imageLocatorService;
    private controlEventDom;
    private sheetEventDom;
    /**
     *
     * @param config - An object to customize bridge behavior
     */
    constructor(config?: Partial<Bridge.Config<any>>);
    /**
     * Get {@link (Bridge:namespace).SheetEventDomain | sheetEventDom}.
     *
     * @internal
     */
    getSheetEventDomain(): Bridge.SheetEventDomain;
    /**
     * Get this bridge {@link (Bridge:namespace).ControlEventDomain}.
     *
     * @remarks
     *
     * The returned object can be used to react from and trigger {@link (Sheet:type)} events.
     */
    getControlEventDomain(): Bridge.ControlEventDomain<D>;
    /**
     * Get transforms.
     */
    getTransforms(): Transforms;
    /**
     * Get image locator, if exists
     */
    getImageLocator(): Bridge.ImageLocationService<any>;
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
 * An entity representing rich text content.
 *
 * @remarks
 *
 * The constructor is not meant to be directly invoked.
 * Instead, use {@link RichContent.fromJSON} or {@link RichContent.fromOps}.
 *
 * @public
 */
export declare class RichContent implements GenericRichContent {
    /**
     * {@inheritdoc GenericRichContent.ops}
     */
    readonly ops: GenericOp[];
    private constructor();
    private static inspectUnmarshalled;
    /**
     * {@inheritdoc GenericRichContent.length}
     */
    length(): number;
    /**
     * Extract the raw text from its array of operations.
     *
     * @returns The underlying raw text.
     */
    toText(): string;
    /**
     * Serialize this instance.
     *
     * @returns The serialized JSON object.
     */
    toJSON(): string;
    /**
     * Creates an instance from a serialized JSON array of operations.
     *
     * @remarks
     *
     * This method throws on multiple occasions:
     *
     * - `SyntaxError` when the `serialized` param is not valid JSON
     * - `TypeError` when the unmarshaleld object doesn't have the expected shape
     *
     * @param serializedContent - The serialized JSON reprenting rich content.
     *
     * @returns The unmarshalled instance.
     */
    static fromJSON(serializedContent: string): RichContent;
    /**
     * Creates an instance from an array of operations.
     *
     * @param ops - The array of operations.
     *
     * @returns The resulting instance.
     */
    static fromOps(ops?: GenericOp[]): RichContent;
}

/**
 * A set of definitions related to the {@link (RichText:type)} component.
 *
 * @public
 */
export declare namespace RichText {
    /**
     * Properties for the {@link (RichText:type)} component.
     */
    export interface Props {
        /**
         * The content to display.
         */
        richContent: GenericRichContent;
        /**
         * An object describing how to convert attributes to style properties.
         *
         * @remarks
         *
         * You can use {@link (Bridge:class).getTransforms} and pass it to this component.
         */
        transforms: Transforms;
        /**
         * Default text style.
         *
         * @remarks
         *
         * Text style can be overriden depending on attributes applying to an {@link GenericOp | operation}.
         * The mapped styled are dictated by the `textTransformsReg` property.
         */
        textStyle?: StyleProp<TextStyle>;
    }
}

/**
 * A component to display rich content.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting members which should be out of API surface.
 */
export declare type RichText = ComponentClass<RichText.Props>;

export declare const RichText: React.ComponentClass<RichText.Props, any>;

/**
 * A set of definitions relative to {@link (Sheet:type)} component.
 *
 * @public
 */
export declare namespace Sheet {
    /**
     * {@link (Sheet:type)} properties.
     */
    export interface Props {
        /**
         * The {@link (Bridge:class)} instance.
         *
         * **Warning** This property cannot be changed after instantiation.
         */
        bridge: Bridge;
        /**
         * Default text style.
         */
        textStyle?: StyleProp<TextStyle>;
        /**
         * The rich content to display.
         */
        initialRichContent?: RichContent;
        /**
         * Handler to receive {@link (RichContent:class)} updates.
         */
        onRichContentUpdate?: (richText: RichContent) => void;
        /**
         * Style applied to the container.
         */
        contentContainerStyle?: StyleProp<ViewStyle>;
    }
}

/**
 * A component solely responsible for displaying and editing {@link (RichContent:class)}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
export declare type Sheet = ComponentClass<Sheet.Props>;

export declare const Sheet: React.ComponentClass<Sheet.Props, any>;

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
    export interface Props<D extends {}> {
        /**
         * The instance to be shared with the {@link (Sheet:type)}.
         */
        bridge: Bridge<D>;
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
 * A component to let user control the {@link (Sheet:type)} through a {@link (Bridge:class)}.
 *
 * @public
 *
 * @internalRemarks
 *
 * This type trick is aimed at preventing from exporting the component State which should be out of API surface.
 */
export declare type Toolbar<D extends {}> = ComponentClass<Toolbar.Props<D>>;

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

export { }
