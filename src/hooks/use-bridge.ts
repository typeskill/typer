import { buildBridge, Bridge } from '@core/Bridge'
import { Images } from '@core/Images'
import { useMemo } from 'react'

/**
 * React hook which returns a bridge.
 *
 * @remarks One bridge instance should exist for one Typer instance.
 * @param deps - A list of values which should trigger, on change, the creation of a new {@link (Bridge:interface)} instance.
 * @public
 */
export function useBridge<ImageSource = Images.StandardSource>(deps: unknown[] = []): Bridge<ImageSource> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildBridge<ImageSource>(), deps)
}
