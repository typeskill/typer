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
 * - The {@link (Typer:type)} component, a support for editing {@link (Document:type)};
 * - The {@link (Print:type)} component, a display for {@link (Document:type)};
 * - The {@link (Toolbar:type)} component, which permits text transforms on current selection.
 *
 * **Controlled components**
 *
 * {@link (Typer:type)} and {@link (Print:type)} components are [controlled components](https://reactjs.org/docs/forms.html#controlled-components).
 * You need to pass them a {@link Document | `document`} prop which you can initialize with {@link buildEmptyDocument}.
 *
 * **Triggering actions from external controls**
 *
 * A {@link (Bridge:interface)} instance must be shared between a {@link (Typer:type)} and any control component such as {@link (Toolbar:type)}.
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
import { Typer } from '@components/Typer'
import { Bridge, buildBridge } from '@core/Bridge'
import {
  Toolbar,
  DocumentControlAction,
  CONTROL_SEPARATOR,
  buildVectorIconControlSpec,
  GenericControlAction,
} from '@components/Toolbar'
import { Attributes } from '@delta/attributes'
import { GenericRichContent } from '@delta/generic'
import { GenericOp, TextOp, ImageOp, BlockOp } from '@delta/operations'
import { Transforms, defaultTextTransforms } from '@core/Transforms'
import { Document, buildEmptyDocument, cloneDocument } from '@model/document'
import { SelectionShape } from '@delta/Selection'
import { Images } from '@core/Images'
import { Print } from '@components/Print'
import { DocumentRendererProps } from '@components/DocumentRenderer'

export {
  // Components related
  Typer,
  Print,
  Toolbar,
  DocumentControlAction,
  GenericControlAction,
  CONTROL_SEPARATOR,
  buildVectorIconControlSpec,
  DocumentRendererProps,
  // Model related
  Bridge,
  Images,
  SelectionShape,
  GenericRichContent,
  GenericOp,
  TextOp,
  ImageOp,
  BlockOp,
  Attributes,
  Transforms,
  Document,
  // Generation
  buildBridge,
  buildEmptyDocument,
  cloneDocument,
  // Customization
  defaultTextTransforms,
}
