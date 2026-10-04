import type { ReactNode } from 'react'
import * as m from 'motion/react-m'
import { cn } from 'cn'
import { SectionChip, type PanelSection } from './panel-sidebar'
import { useDocumentTitle } from './use-document-title'

interface PageHeaderProps {
  section: PanelSection
  title: ReactNode
  description?: ReactNode
  /** Buttons or controls on the right, e.g. "Dodaj innowację" or the range switch. */
  actions?: ReactNode
  /** Extra line under the description: counters, tags, last refresh. */
  meta?: ReactNode
  /** The browser tab title (WCAG 2.4.2); defaults to the section name. */
  documentTitle?: string
  className?: string
}

// The top of every Panel administratora page: the homepage hero light, the section's colour chip and a big title.
export function PageHeader({ section, title, description, actions, meta, documentTitle, className }: PageHeaderProps) {
  useDocumentTitle(documentTitle ?? section.label)

  return (
    <m.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn('relative isolate overflow-hidden rounded-3xl border bg-panel-hero px-5 py-6 sm:px-8 sm:py-7', className)}
    >
      {/* Large faded icon of the section, purely decorative. */}
      <span aria-hidden="true" className="pointer-events-none absolute -top-6 -right-6 -z-10 hidden opacity-[0.07] sm:block dark:opacity-[0.09] [&_svg]:size-44">
        <section.icon stroke={1.25} />
      </span>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-col gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-secondary-foreground">
            <SectionChip section={section} className="size-7 [&_svg]:size-4" />
            {section.label}
          </span>
          <h1 className="text-[1.75rem] leading-tight font-[680] tracking-[-0.03em] text-balance sm:text-[2.125rem]">{title}</h1>
          {description && <p className="max-w-2xl text-[0.9375rem] text-pretty text-secondary-foreground">{description}</p>}
          {meta && <div className="flex flex-wrap items-center gap-2 text-sm">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </m.header>
  )
}
