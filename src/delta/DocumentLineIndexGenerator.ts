import { TextLineType } from './lines'

export class DocumentLineIndexGenerator {
  private lastContiguousOlIndex: null | number = null

  public findNextLineTypeIndex(lineType: TextLineType) {
    if (lineType !== 'normal') {
      this.lastContiguousOlIndex =
        lineType === 'ol' ? (this.lastContiguousOlIndex === null ? 0 : this.lastContiguousOlIndex + 1) : null
    } else {
      this.lastContiguousOlIndex = null
    }
    return lineType === 'ol' ? this.lastContiguousOlIndex || 0 : 0
  }
}
