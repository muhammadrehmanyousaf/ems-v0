"use client"

import { useEffect, useRef, useState } from "react"

/**
 * The value, but no more often than every `delay` ms.
 *
 * WW-PERF. Used to key server-side search queries off form state. Filtering
 * used to happen in a `useMemo` over a client-side copy of the whole catalog,
 * so it re-ran on every keystroke for free (well — for 3,272 array passes).
 * Now each distinct filter state is a request, so the keystrokes have to be
 * collapsed first.
 *
 * Objects are compared by their JSON, not by identity, so a caller can pass a
 * fresh `{ q, city }` literal each render — which is the natural way to write
 * it — without the timer restarting forever on an unchanged value.
 */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  const serialised = JSON.stringify(value)
  const latest = useRef(value)
  latest.current = value

  useEffect(() => {
    const t = setTimeout(() => setDebounced(latest.current), delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialised, delay])

  return debounced
}
