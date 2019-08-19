import { TextBlock } from '@model/TextBlock'
import { StyleProp, TextStyle } from 'react-native'
import { Selection } from '@delta/Selection'
import { GenericRichContent } from '@delta/generic'
import PCancelable from 'p-cancelable'
import { TextOp } from '@delta/operations'

export interface TextBlockControllerProps {
  textOps: TextOp[]
  grow?: boolean
  textStyle?: StyleProp<TextStyle>
}

export interface TextBlockControllerState {
  isControlingState: boolean
  disableEdition: boolean
  overridingSelection: Selection | null
  richContent: GenericRichContent | null
}

export interface SyncSubject {
  setStateAsync: (stateFragment: Partial<TextBlockControllerState>) => PCancelable<void>
  getTextBlock: () => TextBlock
}
