import { useSyncExternalStore } from 'react'

const query = '(prefers-reduced-motion: reduce)'

/** True when the person asked the system to limit animation; charts then render without transitions. */
export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query)
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
