import { useEffect, useRef } from 'react'
import { animate, useReducedMotion } from 'motion/react'

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
    const controls = animate(from, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        node.textContent = format(Number.isInteger(value) ? Math.round(v) : v)
      },
    })
    return () => controls.stop()
  }, [value, format, reduced])

  return <span ref={ref}>{format(value)}</span>
}
