import { ReactTestInstance } from 'react-test-renderer'

export function flattenTextChild(instance: ReactTestInstance): string[] {
  const children: string[] = []
  if (Array.isArray((instance.children))) {
    for (const inst of instance.children) {
      if (typeof inst !== 'string') {
        children.push(...flattenTextChild((inst)))
      } else {
        children.push(inst)
      }
    }
  }
  return children
}
