import { diffChars } from 'diff'
import Delta from 'quill-delta'
import { Attributes } from './attributes'

function getDeltasFromTextDiff(oldText: string, newText: string, attributes?: Attributes.Map) {
  const changes = diffChars(oldText, newText)
  let delta = new Delta()
  for (const change of changes) {
    if (change.added) {
      const lines = change.value.split('\n')
      delta = lines.reduce((d, line, i) => {
        let next = d.insert(line, attributes)
        if (i < lines.length - 1) {
          next = next.insert('\n')
        }
        return next
      }, delta)
    } else if (change.removed && change.count) {
      delta = delta.delete(change.value.length)
    } else if (change.count) {
      delta = delta.retain(change.value.length)
    }
  }
  return delta
}

export function makeDiffDelta(oldText: string, nuText: string, textAttributes: Attributes.Map): Delta {
  return getDeltasFromTextDiff(oldText, nuText, textAttributes)
}
