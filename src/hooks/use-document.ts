import { Document, buildEmptyDocument } from '@model/document'
import { useState } from 'react'

/**
 * React hook to store and update the document.
 *
 * @remarks If you just need an initial document value, use {@link buildEmptyDocument} instead.
 *
 * @param initialDocument - The initial value.
 * @public
 */
export function useDocument(initialDocument: Document = buildEmptyDocument()) {
  return useState(initialDocument)
}
