import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { IconExternalLink } from '@tabler/icons-react'
import { cn } from 'cn'
import { CategoryBadge, CategoryIcon } from '@/components/category-badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { $ai, type CatalogItem } from '@/lib/ai/client'
import { ALL_CATEGORIES, CATEGORIES, categoryFor } from '@/lib/categories'

const PAGE_SIZE = 12

export function KnowledgeBase() {
  const catalog = $ai.useQuery('get', '/catalog', {}, { staleTime: 10 * 60_000, retry: false })
  const [filter, setFilter] = useState(ALL_CATEGORIES.slug)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const listRef = useRef<HTMLUListElement>(null)

  const all = catalog.data?.items ?? []
  const items = filter === ALL_CATEGORIES.slug ? interleaveByCategory(all) : all.filter((item) => item.categorySlug === filter)
  const shown = items.slice(0, visible)

  function pick(slug: string) {
    setFilter(slug)
    setVisible(PAGE_SIZE)
  }

  function showMore() {
    const firstNew = visible
    flushSync(() => setVisible((count) => count + PAGE_SIZE))
    listRef.current?.querySelectorAll<HTMLElement>(':scope > li > *')[firstNew]?.focus()
  }

  return (
    <section aria-labelledby="kb-title" className="mx-auto flex w-full max-w-[73.75rem] flex-col gap-7 px-4 pt-12 pb-18 sm:px-6">
      <h2 id="kb-title" className="text-[1.875rem] leading-[2.375rem] font-[650] tracking-[-0.03em]">
        Baza wiedzy
      </h2>

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

      {catalog.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-destructive p-4">
          <p className="font-semibold text-destructive">Nie udało się wczytać bazy wiedzy.</p>
          <Button variant="outline" className="h-11 px-4" onClick={() => catalog.refetch()}>
            Spróbuj ponownie
          </Button>
        </div>
      ) : (
        <ul ref={listRef} className="grid grid-cols-[repeat(auto-fill,minmax(min(18.75rem,100%),1fr))] gap-4">
          {shown.map((item) => (
            <CatalogTile key={item.id} item={item} />
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-3 pt-4">
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          {catalog.isPending ? (
            <>
              <Spinner />
              Wczytujemy materiały…
            </>
          ) : catalog.isSuccess ? (
            `Pokazujemy ${shown.length} z ${items.length} materiałów.`
          ) : null}
        </p>
        {shown.length < items.length && (
          <Button variant="outline" className="h-11 px-5 text-base" onClick={showMore}>
            Pokaż więcej
          </Button>
        )}
      </div>
    </section>
  )
}

function CatalogTile({ item }: { item: CatalogItem }) {
  const category = categoryFor(item.categorySlug)
  const content = (
    <>
      {category && <CategoryBadge category={category} />}
      <span className="mt-1 text-[1.0625rem] leading-[1.4375rem] font-semibold tracking-[-0.01em]">{item.title}</span>
      <span className="line-clamp-3 text-[0.9375rem] leading-[1.3125rem] text-muted-foreground">{item.summary}</span>
      <span className="mt-auto flex items-center gap-1 pt-1 text-xs text-muted-foreground">
        Źródło: {item.source.label}
        {item.source.url && (
          <>
            <IconExternalLink aria-hidden="true" className="size-3.5" />
            <span className="sr-only">(otwiera się w nowej karcie)</span>
          </>
        )}
      </span>
    </>
  )
  const className =
    'flex h-full min-h-[10.75rem] flex-col gap-2 rounded-[1.125rem] border border-tile-border bg-tile px-5 py-[1.125rem] text-card-foreground shadow-[0_1px_2px_0_rgb(15_27_45/0.05),0_4px_12px_-6px_rgb(15_27_45/0.08)] transition-[box-shadow,border-color] hover:border-[#C9D3DF] hover:shadow-[0_10px_24px_-12px_rgb(15_27_45/0.18)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring'

  return (
    <li>
      {item.source.url ? (
        <a href={item.source.url} target="_blank" rel="noopener noreferrer" className={className}>
          {content}
        </a>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  )
}

// The AI service returns records grouped by category; mix them so "Wszystkie" doesn't open with one category.
function interleaveByCategory(items: CatalogItem[]) {
  const groups = new Map<string, CatalogItem[]>()
  for (const item of items) {
    const key = item.categorySlug ?? ''
    groups.set(key, [...(groups.get(key) ?? []), item])
  }
  const queues = [...groups.values()]
  const mixed: CatalogItem[] = []
  for (let i = 0; mixed.length < items.length; i++) {
    for (const queue of queues) if (queue[i]) mixed.push(queue[i])
  }
  return mixed
}
