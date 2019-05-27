import invariant from 'invariant'
import { DeltaChangeContext } from '@delta/DocumentDelta'

// A function to mock a change context
export function mockDeltaChangeContext(beforeStart: number, afterStart: number, beforeEnd?: number): DeltaChangeContext {
  invariant(beforeEnd === undefined || beforeEnd > beforeStart, '')
  return {
    selectionBeforeChange: {
      start: beforeStart,
      end: beforeEnd !== undefined ? beforeEnd : beforeStart
    },
    selectionAfterChange: {
      start: afterStart,
      end: afterStart
    }
  }
}
