import { Sheet } from '@components/Sheet'
import { RichText } from '@components/RichText'
import { Bridge } from '@core/Bridge'
import { Toolbar, ControlAction, TEXT_CONTROL_SEPARATOR, buildVectorIconControlSpec } from '@components/Toolbar'
import { BlockAttributesMap } from '@delta/attributes'
import { TextLineType, TextLengthModifierLineType } from '@delta/lines'
import {
  BaseTextTransformAttribute,
  BooleanTextTransformSpec,
  TextTransformSpec,
  TextTransformsDictionnary,
} from '@core/transforms'
import { DeltaChangeContext } from '@delta/DeltaChangeContext'
import { GenericDelta } from '@delta/generic'
import { DocumentDelta } from '@delta/DocumentDelta'
import { RichContent } from '@model/RichContent'

/**
 *
 * Typeskill, the Operational-Transform Based (React) Native Rich Text library.
 *
 * @remarks
 *
 * The library exposes a naked {@link Sheet:class} component, which represents a support for editing {@link RichContent:class}.
 * It also exposes a {@link RichText:class} component, which solely display the {@link RichContent:class}.
 * The {@link Sheet:class} component is solely responsible for displaying and editing {@link RichContent:class}.
 * This {@link Sheet:class} component needs a {@link Bridge:class} object which you can instanciate in the controlling root component.
 *
 * The actions are triggered with the {@link Bridge:namespace.InnerInterface | outerInterface} from the same {@link Bridge} instance. Such actions include:
 * - insert media content;
 * - change line type (normal, lists);
 * - set text attributes to selection (bold, italic).
 *
 * @packageDocumentation
 */

export {
  // @components
  Sheet,
  RichText,
  Toolbar,
  ControlAction,
  TEXT_CONTROL_SEPARATOR,
  buildVectorIconControlSpec,
  // @core
  Bridge,
  RichContent,
  // @delta/attributes
  BlockAttributesMap,
  // @delta/transforms
  BaseTextTransformAttribute,
  TextLineType,
  TextLengthModifierLineType,
  BooleanTextTransformSpec,
  TextTransformSpec,
  TextTransformsDictionnary,
  // @delta/DocumentDelta
  DocumentDelta,
  DeltaChangeContext,
  GenericDelta,
}
