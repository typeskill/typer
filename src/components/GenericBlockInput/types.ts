import { BlockDescriptor } from '@model/blocks'
import { BlockController } from '@components/BlockController'
import { SelectionShape } from '@delta/Selection'

export interface StandardBlockInputProps {
  descriptor: BlockDescriptor
  controller: BlockController
  isFocused: boolean
  overridingScopedSelection: SelectionShape | null
}

/**
 * @public
 */
export interface FocusableInput {
  /**
   * Focus programatically.
   */
  focus: () => void
}
