import { TextBlock } from '@model/TextBlock'
import { StyleProp, TextStyle } from 'react-native'
import { Selection } from '@delta/Selection'
import { GenericOp } from '@delta/operations'

export interface TextBlockControllerProps {
  textBlock: TextBlock
  grow?: boolean
  textStyle?: StyleProp<TextStyle>
}

export interface TextBlockControllerState {
  isControlingState: boolean
  overridingSelection: Selection | null
  ops: GenericOp[] | null
}

export interface TextBlockMinimalComponent {
  setState<K extends keyof TextBlockControllerState>(
    state:
      | ((
          prevState: Readonly<TextBlockControllerState>,
        ) => Pick<TextBlockControllerState, K> | TextBlockControllerState | null)
      | (Pick<TextBlockControllerState, K> | TextBlockControllerState | null),
    callback?: () => void,
  ): void
}
