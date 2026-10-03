import { useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { Link } from '@tanstack/react-router'
import { IconChevronDown, IconMovie, IconPhone, IconRosetteDiscountCheck } from '@tabler/icons-react'
import { cn } from 'cn'
import { CategoryBadge, CategoryIcon } from '@/components/category-badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import type { CatalogItem } from '@/lib/ai/client'
import { ALL_CATEGORIES, CATEGORIES, categoryFor } from '@/lib/categories'

const FIRST_PAGE = 12
const NEXT_PAGE = 9

/** A catalog record, or a search result shaped like one. Helpers have no innovation page, only a phone. */
export type TileItem = CatalogItem & { phone?: string; opensPage?: boolean }

type Props = {
  title: string
  /** Rendered next to the heading, e.g. "Wyczyść wyszukiwanie". */
  headerAction?: ReactNode
  items: TileItem[]
  state: 'pending' | 'error' | 'success'
  errorText: string
  onRetry: () => void
  /** Mix categories in "Wszystkie" (the catalog arrives grouped); search results keep their ranking. */
  interleave?: boolean
  /** Move focus to the heading on mount, e.g. when results replace the catalog. */
  focusTitle?: boolean
}

export function TileBrowser({ title, headerAction, items: all, state, errorText, onRetry, interleave = false, focusTitle = false }: Props) {
  const [filter, setFilter] = useState(ALL_CATEGORIES.slug)
  const [visible, setVisible] = useState(FIRST_PAGE)
  const listRef = useRef<HTMLUListElement>(null)

  const items =
    filter === ALL_CATEGORIES.slug ? (interleave ? interleaveByCategory(all) : all) : all.filter((item) => item.categorySlug === filter)
  const shown = items.slice(0, visible)

  function pick(slug: string) {
    setFilter(slug)
    setVisible(FIRST_PAGE)
  }

  function showMore() {
    const firstNew = visible
    flushSync(() => setVisible((count) => count + NEXT_PAGE))
    listRef.current?.querySelectorAll<HTMLElement>(':scope > li > :first-child')[firstNew]?.focus()
  }

  return (
    <section aria-labelledby="kb-title" className="mx-auto flex w-full max-w-[73.75rem] flex-col gap-7 px-4 pt-12 pb-18 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="kb-title"
          ref={focusTitle ? focusOnMount : undefined}
          tabIndex={focusTitle ? -1 : undefined}
          className="text-[1.875rem] leading-[2.375rem] font-[650] tracking-[-0.03em] outline-none"
        >
          {title}
        </h2>
        {headerAction}
      </div>

      <div
        role="group"
        aria-label="Filtruj według kategorii"
        className="-m-1 flex gap-2 overflow-x-auto p-1 pr-12 [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_calc(100%-4rem),transparent)]"
      >
        {[ALL_CATEGORIES, ...CATEGORIES].map((category) => (
          <button
            key={category.slug}
            type="button"
            aria-pressed={filter === category.slug}
            onClick={() => pick(category.slug)}
            style={filter === category.slug ? { background: category.tint } : undefined}
            className={cn(
              'inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-muted py-0 pr-[1.125rem] pl-1.5 text-[0.9375rem] font-medium whitespace-nowrap text-secondary-foreground transition-colors hover:bg-border hover:text-foreground',
              'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring',
              'aria-pressed:font-semibold aria-pressed:text-foreground aria-pressed:shadow-[inset_0_0_0_1px_rgb(15_27_45/0.06)]',
            )}
          >
            <CategoryIcon category={category} />
            {category.label}
          </button>
        ))}
      </div>

      {state === 'error' ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive p-4">
          <p className="font-semibold text-destructive">{errorText}</p>
          <Button variant="outline" className="h-11 px-4" onClick={onRetry}>
            Spróbuj ponownie
          </Button>
        </div>
      ) : (
        <ul ref={listRef} className="grid grid-cols-[repeat(auto-fill,minmax(min(18.75rem,100%),1fr))] gap-4">
          {shown.map((item) => (
            <Tile key={item.id} item={item} />
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-3 pt-4">
        {state === 'pending' && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Wczytujemy innowacje…
          </p>
        )}
        {state === 'success' && shown.length < items.length && (
          <button
            type="button"
            onClick={showMore}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <IconChevronDown aria-hidden="true" className="size-4" />
            Pokaż kolejne innowacje ({shown.length} z {items.length})
          </button>
        )}
        {state === 'success' && shown.length >= items.length && (
          <p role="status" className="text-center text-sm text-muted-foreground">
            {items.length === 0 ? 'Brak innowacji w tej kategorii.' : `To wszystkie innowacje w tej kategorii (${items.length}).`}
          </p>
        )}
      </div>
    </section>
  )
}

const focusOnMount = (element: HTMLHeadingElement | null) => element?.focus()

const tileClass =
  'flex h-full min-h-[12.25rem] flex-col gap-2 rounded-[1.125rem] border border-tile-border bg-tile px-5 py-[1.125rem] text-card-foreground shadow-[0_1px_2px_0_rgb(15_27_45/0.05),0_4px_12px_-6px_rgb(15_27_45/0.08)] transition-[box-shadow,border-color] hover:border-[#C9D3DF] hover:shadow-[0_10px_24px_-12px_rgb(15_27_45/0.18)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring'

function Tile({ item }: { item: TileItem }) {
  const category = categoryFor(item.categorySlug)
  const body = (
    <>
      {category && <CategoryBadge category={category} />}
      <span className="mt-1 text-[1.0625rem] leading-[1.4375rem] font-semibold tracking-[-0.01em]">{item.title}</span>
      <span className="line-clamp-3 text-[0.9375rem] leading-[1.3125rem] text-muted-foreground">{item.subtitle ?? item.summary}</span>
    </>
  )
  const markers = (
    <>
      {item.hasVideo && (
        <span className="inline-flex items-center gap-1.5">
          <IconMovie aria-hidden="true" className="size-4" />
          Film
        </span>
      )}
      {item.featured && (
        <span className="inline-flex items-center gap-1.5 text-[#7A4300]">
          <IconRosetteDiscountCheck aria-hidden="true" className="size-4" />
          Polecana
        </span>
      )}
    </>
  )
  const footerClass = 'mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1.5 pt-1.5 text-[0.8125rem] leading-[1.125rem] text-muted-foreground'

  if (item.opensPage === false) {
    return (
      <li>
        <div className={tileClass}>
          {body}
          <span className={footerClass}>
            {item.phone && (
              <a href={`tel:${item.phone.replace(/\s/g, '')}`} className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline-offset-2 hover:underline">
                <IconPhone aria-hidden="true" className="size-4" />
                Zadzwoń: {item.phone}
              </a>
            )}
            <span>{item.source.label}</span>
          </span>
        </div>
      </li>
    )
  }

  return (
    <li>
      <Link to="/innowacja/$id" params={{ id: item.id }} className={tileClass}>
        {body}
        <span className={footerClass}>
          {markers}
          <span>Biblioteka Innowacji ROPS</span>
        </span>
      </Link>
    </li>
  )
}

// The AI service returns records grouped by category; mix them so "Wszystkie" doesn't open with one category.
function interleaveByCategory(items: TileItem[]) {
  const groups = new Map<string, TileItem[]>()
  for (const item of items) {
    const key = item.categorySlug ?? ''
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  const queues = [...groups.values()]
  const mixed: TileItem[] = []
  for (let i = 0; mixed.length < items.length; i++) {
    for (const queue of queues) if (queue[i]) mixed.push(queue[i])
  }
  return mixed
}
