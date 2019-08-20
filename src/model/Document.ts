/* eslint-disable @typescript-eslint/no-explicit-any */
import { Bridge } from '@core/Bridge'
import { Orchestrator } from '@model/Orchestrator'
import { Attributes } from '@delta/attributes'
import { SelectionShape } from '@delta/Selection'
import { GenericOp } from '@delta/operations'

declare namespace Document {
  export interface Content {
    ops: GenericOp[]
    currentSelection: SelectionShape
    textAttributesAtCursor: Attributes.Map
  }
  export interface BlockInterface {
    readonly sheetEventDom: Bridge.SheetEventDomain
    readonly orchestrator: Orchestrator
    readonly onPressBackspaceFromOrigin: () => void
    readonly onPressEnter: () => void
  }
}

export { Document }
