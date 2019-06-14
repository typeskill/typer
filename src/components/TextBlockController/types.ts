import { TextBlock } from '@model/TextBlock'
import { StyleProp, TextStyle } from 'react-native'
import { Selection } from '@delta/Selection'
import { GenericOp } from '@delta/operations'
import { ClassicComponent } from 'react'

export interface TextBlockControllerProps<T extends string> {
  textBlock: TextBlock<T>
  grow?: boolean
  textStyle?: StyleProp<TextStyle>
}

export interface TextBlockControllerState {
  isControlingState: boolean
  overridingSelection: Selection | null
  ops: GenericOp[] | null
}

export type TextBlockComponent = ClassicComponent<TextBlockControllerProps<any>, TextBlockControllerState>
