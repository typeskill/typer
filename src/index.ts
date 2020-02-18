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
export { Typer } from '@components/Typer'
export { Print } from '@components/Print'
export { Bridge, buildBridge } from '@core/Bridge'
export {
  Toolbar,
  DocumentControlAction,
  CONTROL_SEPARATOR,
  buildVectorIconControlSpec,
  GenericControlAction,
} from '@components/Toolbar'
export { useBridge } from '@hooks/use-bridge'
export { useDocument } from '@hooks/use-document'
export { Attributes } from '@delta/attributes'
export { GenericRichContent } from '@delta/generic'
export { GenericOp, TextOp, ImageOp, BlockOp, ImageKind } from '@delta/operations'
export { Transforms, defaultTextTransforms } from '@core/Transforms'
export { Document, buildEmptyDocument, cloneDocument } from '@model/document'
export { SelectionShape } from '@delta/Selection'
export { Images } from '@core/Images'
export { DocumentRendererProps } from '@components/DocumentRenderer'
export { FocusableInput } from '@components/GenericBlockInput'
