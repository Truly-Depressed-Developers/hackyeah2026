import type { ReactNode } from 'react'
import { cn } from 'cn'

const segmentButton =
  'inline-flex h-10 min-w-11 items-center justify-center gap-[7px] rounded-full px-3 text-sm leading-none font-semibold text-secondary-foreground transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring'

// EN is shown per the design but not implemented yet (HAC-19), so it is aria-disabled rather than a dead button.
export function LanguageSwitch() {
  return (
    <div role="group" aria-label="Język" className="flex h-[2.875rem] items-center gap-0.5 rounded-full bg-muted p-[3px]">
      <button
        type="button"
        lang="pl"
        aria-label="Polski"
        aria-pressed="true"
        className={cn(
          segmentButton,
          'bg-background text-primary-strong shadow-[0_1px_3px_0_rgb(15_27_45/0.12),0_0_0_1px_rgb(34_99_173/0.25)]',
        )}
      >
        <Flag>
          <svg viewBox="0 0 16 10" preserveAspectRatio="none">
            <rect width="16" height="5" fill="#fff" />
            <rect y="5" width="16" height="5" fill="#DC143C" />
          </svg>
        </Flag>
        PL
      </button>
      <button
        type="button"
        lang="en"
        aria-label="English — wkrótce"
        aria-pressed="false"
        aria-disabled="true"
        title="Wersja angielska — wkrótce"
        className={segmentButton}
      >
        <Flag>
          <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
            <rect width="60" height="30" fill="#012169" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="2" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
          </svg>
        </Flag>
        EN
      </button>
    </div>
  )
}

function Flag({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden="true" className="inline-block h-3.5 w-5 overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgb(15_27_45/0.15)] [&_svg]:block [&_svg]:size-full">
      {children}
    </span>
  )
}
