import type { ReactNode } from 'react'
import { IconBulb, IconCircleCheck, IconPhoneCall, IconProgress, IconSearchOff, type Icon } from '@tabler/icons-react'
import { cn } from 'cn'
import { statusLabel, type HandlingStatus } from './handling'

// Colourful pills for the Panel administratora. Colour only helps scanning: every tag also carries its text
// (and an icon), and each text/background pair keeps WCAG AA contrast in both themes.

const tagBase = 'inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset'

export const TAG_TONES = {
  blue: 'bg-sky-100 text-sky-900 ring-sky-300/70 dark:bg-sky-400/15 dark:text-sky-100 dark:ring-sky-300/30',
  amber: 'bg-amber-100 text-amber-900 ring-amber-300/70 dark:bg-amber-400/15 dark:text-amber-100 dark:ring-amber-300/30',
  green: 'bg-emerald-100 text-emerald-900 ring-emerald-300/70 dark:bg-emerald-400/15 dark:text-emerald-100 dark:ring-emerald-300/30',
  rose: 'bg-rose-100 text-rose-900 ring-rose-300/70 dark:bg-rose-400/15 dark:text-rose-100 dark:ring-rose-300/30',
  violet: 'bg-violet-100 text-violet-900 ring-violet-300/70 dark:bg-violet-400/15 dark:text-violet-100 dark:ring-violet-300/30',
  teal: 'bg-teal-100 text-teal-900 ring-teal-300/70 dark:bg-teal-400/15 dark:text-teal-100 dark:ring-teal-300/30',
  slate: 'bg-slate-100 text-slate-800 ring-slate-300/70 dark:bg-slate-400/15 dark:text-slate-100 dark:ring-slate-300/30',
  brand: 'bg-primary-soft text-primary-strong ring-primary/25',
} as const

export type TagTone = keyof typeof TAG_TONES

export function Tag({ tone, icon: Icon, children, className }: { tone: TagTone; icon?: Icon; children: ReactNode; className?: string }) {
  return (
    <span className={cn(tagBase, TAG_TONES[tone], className)}>
      {Icon && <Icon aria-hidden="true" className="-ml-0.5 size-3.5" stroke={2.25} />}
      {children}
    </span>
  )
}

const STATUS_TONE: Record<HandlingStatus, TagTone> = { new: 'blue', in_progress: 'amber', done: 'green' }

/** Stan; "Nowe" gets a live dot so unread work stands out in a long list. */
export function StatusTag({ status, prefix }: { status: HandlingStatus; prefix?: string }) {
  return (
    <span className={cn(tagBase, TAG_TONES[STATUS_TONE[status]])}>
      {status === 'new' ? (
        <span aria-hidden="true" className="relative -ml-0.5 flex size-2">
          <span className="absolute inset-0 animate-ping rounded-full bg-sky-500 opacity-60 motion-reduce:animate-none" />
          <span className="relative size-2 rounded-full bg-sky-500" />
        </span>
      ) : status === 'in_progress' ? (
        <IconProgress aria-hidden="true" className="-ml-0.5 size-3.5" stroke={2.25} />
      ) : (
        <IconCircleCheck aria-hidden="true" className="-ml-0.5 size-3.5" stroke={2.25} />
      )}
      {prefix}
      {statusLabel[status]}
    </span>
  )
}

// Rodzaj of a Potrzeba (CONTEXT.md), each with its own colour and icon.
export const KIND_TAGS = {
  gap: { label: 'Luka', tone: 'rose', icon: IconSearchOff },
  contact_request: { label: 'Prośba o kontakt', tone: 'violet', icon: IconPhoneCall },
  idea: { label: 'Pomysł', tone: 'teal', icon: IconBulb },
} as const satisfies Record<string, { label: string; tone: TagTone; icon: Icon }>

export function KindTag({ kind }: { kind: keyof typeof KIND_TAGS }) {
  const { label, tone, icon } = KIND_TAGS[kind]
  return (
    <Tag tone={tone} icon={icon}>
      {label}
    </Tag>
  )
}
