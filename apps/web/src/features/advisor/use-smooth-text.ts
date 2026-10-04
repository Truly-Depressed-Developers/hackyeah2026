import { useEffect, useRef, useState } from 'react'

const BASE_CHARS_PER_SECOND = 90
// The backlog drains in about this long, so bursts speed the typing up instead of piling up behind it.
const CATCH_UP_SECONDS = 0.7

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Reveals `target` at a steady pace however unevenly it arrives. The AI service sends the
 * report in bursts; typing it out evenly reads as writing rather than as a page jumping.
 */
export function useSmoothText(target: string) {
  const [shown, setShown] = useState(() => (reducedMotion() ? target.length : 0))
  const targetRef = useRef(target)
  const shownRef = useRef(shown)

  useEffect(() => {
    targetRef.current = target
  })

  useEffect(() => {
    if (reducedMotion()) {
      const timer = setInterval(() => setShown(targetRef.current.length), 250)
      return () => clearInterval(timer)
    }

    let frame = 0
    let last = performance.now()
    let carry = 0
    const tick = (now: number) => {
      const seconds = Math.min(0.1, (now - last) / 1000)
      last = now
      const backlog = targetRef.current.length - shownRef.current
      if (backlog > 0) {
        carry += Math.max(BASE_CHARS_PER_SECOND, backlog / CATCH_UP_SECONDS) * seconds
        const step = Math.floor(carry)
        if (step > 0) {
          carry -= step
          shownRef.current = Math.min(targetRef.current.length, shownRef.current + step)
          setShown(shownRef.current)
        }
      } else {
        carry = 0
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return { text: target.slice(0, shown), done: shown >= target.length }
}
