import { DocumentDelta } from '@delta/DocumentDelta'
import { GenericOp, buildImageOp, ImageOp } from '@delta/operations'

export function mockDocumentDelta(ops?: GenericOp[]): DocumentDelta {
  return new DocumentDelta(ops)
}

export function buildDummyImageOp(uri = 'A'): ImageOp<any> {
  return buildImageOp({ height: 10, width: 10, source: { uri } })
}
