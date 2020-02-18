import { Document, buildEmptyDocument } from './model/document'
import { buildBridge } from './core/Bridge'
import { Images } from './core/Images'
import { useState, useMemo } from 'react'

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

/**
 * React hook which returns a bridge.
 *
 * @remarks One bridge instance should exist for one Typer instance.
 * @param deps - A list of values which should trigger, on change, the creation of a new {@link (Bridge:interface)} instance.
 * @public
 */
export function useBridge<ImageSource = Images.StandardSource>(deps: unknown[] = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildBridge<ImageSource>(), deps)
}
