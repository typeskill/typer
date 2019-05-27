// TODO delete

import { diffLines, diffWordsWithSpace, Change } from 'diff'
import Delta from 'quill-delta'
import last from 'ramda/es/last'
import { TextAttributesMap } from './attributes'

function getDeltasFromTextDiff<T extends string>(oldText: string, newText: string, attributes?: TextAttributesMap<T>) {
  const changes = diffWordsWithSpace(oldText, newText)
  let delta = new Delta()
  for (const change of changes) {
    if (change.added) {
      delta = delta.insert(change.value, attributes)
    } else if (change.removed && change.count) {
      delta = delta.delete(change.value.length)
    } else if (change.count) {
      delta = delta.retain(change.value.length)
    }
  }
  return delta
}

interface LineDiffReport {
  kind: 'RETAINED' | 'DELETED' | 'REPLACED' | 'INSERTED'
  value: string
  count: number
  diff?: Delta
}

/**
 * Returns a list of reports.
 * 
 * @param oldText 
 * @param nuText 
 */
export function getLineDiffReports(oldText: string, nuText: string): LineDiffReport[] {
  const lines = diffLines(oldText, nuText)
  const reports: LineDiffReport[] = []
  lines.forEach((change: Change) => {
    if (change.added) {
      const lastReport = last(reports)
      if (lastReport && lastReport.kind === 'DELETED') {
        reports.pop()
        reports.push({
          count: 1,
          kind: 'REPLACED',
          value: change.value,
          diff: getDeltasFromTextDiff(lastReport.value, change.value)
        })
      } else {
        reports.push({ kind: 'INSERTED', value: change.value, count: 1 })
      }
    } else if (change.removed && change.count) {
      const lastReport = last(reports)
      if (lastReport && lastReport.kind === 'INSERTED') {
        reports.pop()
        reports.push({
          count: 1,
          kind: 'REPLACED',
          value: change.value,
          diff: getDeltasFromTextDiff(lastReport.value, change.value)
        })
      } else {
        reports.push({ kind: 'DELETED', value: change.value, count: 1 })
      }
    } else if (change.count) {
      reports.push({ kind: 'RETAINED', value: change.value, count: change.count })
    }
  })
  return reports
}

export function makeDiffDelta(oldText: string, nuText: string): Delta {
  return getDeltasFromTextDiff(oldText, nuText)
}
