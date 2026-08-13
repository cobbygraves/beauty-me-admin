import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

/**
 * Viewport width as an external store rather than effect-driven state.
 *
 * `matchMedia` is exactly the kind of platform API `useSyncExternalStore`
 * exists for: reading it during render keeps the first client paint correct
 * instead of flashing the desktop layout for a frame, and the server snapshot
 * pins SSR to the desktop branch so the markup is deterministic.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
