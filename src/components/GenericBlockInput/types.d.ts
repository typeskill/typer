import { BlockDescriptor } from '@model/blocks'
import { DocumentController } from '@components/DocumentController'
import { SelectionShape } from '@delta/Selection'

export interface StandardBlockInputProps {
  descriptor: BlockDescriptor
  controller: DocumentController
  isFocused: boolean
  overridingScopedSelection: SelectionShape | null
}
