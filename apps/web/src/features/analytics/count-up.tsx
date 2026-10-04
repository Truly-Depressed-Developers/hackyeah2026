import { useEffect, useRef } from 'react'
import { useReducedMotion } from './use-reduced-motion'

const DURATION_MS = 900
const easeOut = (t: number) => 1 - (1 - t) ** 3

/** A number that counts from its previous value to the new one; static when the OS asks for reduced motion. */
export function CountUp({ value, format }: { value: number; format: (value: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    const from = previous.current
    previous.current = value
    if (!node || reduced || from === value) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS)
      const v = from + (value - from) * easeOut(t)
      node.textContent = format(Number.isInteger(value) ? Math.round(v) : v)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      node.textContent = format(value)
    }
  }, [value, format, reduced])

  return <span ref={ref}>{format(value)}</span>
}
