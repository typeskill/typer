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
 * **Triggering actions from external controls**
 *
 * A {@link (Bridge:interface)} instance should be shared between a {@link (Typer:type)} and any control component such as {@link (Toolbar:type)}.
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
import { Toolbar, ControlAction, CONTROL_SEPARATOR, buildVectorIconControlSpec } from '@components/Toolbar'
import { Attributes } from '@delta/attributes'
import { GenericRichContent } from '@delta/generic'
import { GenericOp, TextOp } from '@delta/operations'
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
  ControlAction,
  CONTROL_SEPARATOR,
  buildVectorIconControlSpec,
  DocumentRendererProps,
  // Model related
  Bridge,
  Images,
  GenericRichContent,
  GenericOp,
  SelectionShape,
  TextOp,
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
