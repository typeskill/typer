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
 * - The {@link (Typer:type)} component, a support for editing {@link (DocumentContent:type)}.
 * - The {@link (Print:class)} component, a display for {@link (DocumentContent:type)}.
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
import { Typer } from '@components/Typer'
import { RichText } from '@components/RichText'
import { Bridge } from '@core/Bridge'
import { Toolbar, ControlAction, CONTROL_SEPARATOR, buildVectorIconControlSpec } from '@components/Toolbar'
import { Attributes } from '@delta/attributes'
import { GenericRichContent } from '@delta/generic'
import { GenericOp, TextOp } from '@delta/operations'
import { Transforms, defaultTextTransforms } from '@core/Transforms'
import { DocumentContent, buildInitialDocContent, cloneDocContent } from '@model/documents'
import { SelectionShape } from '@delta/Selection'
import { defaultImageLocator, Image } from '@core/Image'
import { Gen } from '@core/Gen'

export {
  // Components related
  Typer,
  RichText,
  Toolbar,
  ControlAction,
  CONTROL_SEPARATOR,
  buildVectorIconControlSpec,
  // Model related
  Bridge,
  Gen,
  Image,
  GenericRichContent,
  GenericOp,
  SelectionShape,
  TextOp,
  Attributes,
  Transforms,
  DocumentContent,
  // Generation
  buildInitialDocContent,
  cloneDocContent,
  // Customization
  defaultImageLocator,
  defaultTextTransforms,
}
