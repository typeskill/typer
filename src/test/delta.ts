import invariant from 'invariant'
import { DeltaChangeContext } from '@delta/DeltaChangeContext'
import { Selection } from '@delta/Selection'

// A function to mock a change context
export function mockDeltaChangeContext(
  beforeStart: number,
  afterStart: number,
  beforeEnd?: number,
): DeltaChangeContext {
  invariant(beforeEnd === undefined || beforeEnd > beforeStart, '')
  return new DeltaChangeContext(Selection.fromBounds(beforeStart, beforeEnd), Selection.fromBounds(afterStart))
}

export function mockSelection(start: number, end?: number): Selection {
  return Selection.fromBounds(start, end)
}
