import { NativeSyntheticEvent, TextInputSelectionChangeEventData } from 'react-native'
import { ReactTestInstance } from 'react-test-renderer'

export function mockSelectionChangeEvent(
  start: number,
  end: number,
): NativeSyntheticEvent<TextInputSelectionChangeEventData> {
  // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
  return { nativeEvent: { selection: { start, end } } } as NativeSyntheticEvent<TextInputSelectionChangeEventData>
}

export function flattenTextChild(instance: ReactTestInstance): string[] {
  const children: string[] = []
  if (Array.isArray(instance.children)) {
    for (const inst of instance.children) {
      if (typeof inst !== 'string') {
        children.push(...flattenTextChild(inst))
      } else {
        children.push(inst)
      }
    }
  }
  return children
}
