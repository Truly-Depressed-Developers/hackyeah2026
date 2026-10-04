import type { ReactNode } from 'react'
import * as m from 'motion/react-m'
import { cn } from 'cn'

/** Fades a block in from just below, `order` staggering blocks on one page. Off under reduced motion (MotionConfig). */
export function Reveal({ order = 0, className, children }: { order?: number; className?: string; children: ReactNode }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 + order * 0.06, ease: [0.22, 1, 0.36, 1] }}
      // min-w-0: as a grid item it must be able to shrink below its content (long Zapytania truncate inside).
      className={cn('min-w-0', className)}
    >
      {children}
    </m.div>
  )
}
