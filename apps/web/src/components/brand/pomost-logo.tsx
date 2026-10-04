import type { CSSProperties } from 'react'
import { cn } from 'cn'

/**
 * The "Podane ręce" mark: two people (coral seeker, navy helper) whose arms form the span of a bridge.
 * Navy parts follow `currentColor` so dark mode can lighten them.
 * `onWhite`: the mark sits on its own white tile, so it keeps the original navy in dark mode too.
 */
export function PomostMark({ className, style, onWhite = false }: { className?: string; style?: CSSProperties; onWhite?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={cn('text-[#1E4B7A]', !onWhite && 'dark:text-[#9CC2EC]', className)} style={style}>
      <path d="M5 45H59" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M13 57V36C13 28 20 24.5 28.5 24.5" stroke="#E0653F" strokeWidth="6" strokeLinecap="round" />
      <path d="M51 57V36C51 28 44 24.5 35.5 24.5" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <circle cx="13" cy="13" r="6.5" fill="#E0653F" />
      <circle cx="51" cy="13" r="6.5" fill="currentColor" />
    </svg>
  )
}

/**
 * Mark, wordmark and tagline. Every size derives from the mark's height (`size`, in rem so the
 * text-size switch scales it): gap 0.2×, wordmark 0.56×, tagline 0.19×, as in the logo sheet.
 */
export function PomostLogo({ size = 3.25, tagline = true, className }: { size?: number; tagline?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center font-brand', className)} style={{ gap: `${size * 0.2}rem` }}>
      <PomostMark className="shrink-0" style={{ width: `${size}rem`, height: `${size}rem` }} />
      <span className="flex flex-col">
        <span className="leading-none font-extrabold tracking-[-0.01em] text-[#1E4B7A] dark:text-[#9CC2EC]" style={{ fontSize: `${size * 0.56}rem` }}>
          Pomost
        </span>
        {tagline && (
          <span className="font-semibold text-[#4F6478] dark:text-muted-foreground" style={{ fontSize: `${Math.max(0.625, size * 0.19)}rem`, lineHeight: 1.2, marginTop: `${size * 0.075}rem` }}>
            pomoc w Małopolsce
          </span>
        )}
      </span>
    </span>
  )
}
