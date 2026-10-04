import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { IconChevronDown } from '@tabler/icons-react'
import { cn } from 'cn'
import { CategoryIcon } from '@/components/category-badge'
import { InnovationTile, TILE_GRID } from '@/components/innovation/innovation-tile'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { $ai, type CatalogItem } from '@/lib/ai/client'
import { markFromCatalog, track } from '@/lib/analytics'
import { ALL_CATEGORIES, CATEGORIES } from '@/lib/categories'

const FIRST_PAGE = 12
const NEXT_PAGE = 9

export function KnowledgeBase() {
  const catalog = $ai.useQuery('get', '/catalog', {}, { staleTime: 10 * 60_000, retry: false })
  const [filter, setFilter] = useState(ALL_CATEGORIES.slug)
  const [visible, setVisible] = useState(FIRST_PAGE)
  const listRef = useRef<HTMLUListElement>(null)

  const all = catalog.data?.items ?? []
  const items = filter === ALL_CATEGORIES.slug ? interleaveByCategory(all) : all.filter((item) => item.categorySlug === filter)
  const shown = items.slice(0, visible)

  function pick(slug: string) {
    track({ type: 'catalog_filtered', category: slug })
    setFilter(slug)
    setVisible(FIRST_PAGE)
  }

  function showMore() {
    const firstNew = visible
    flushSync(() => setVisible((count) => count + NEXT_PAGE))
    listRef.current?.querySelectorAll<HTMLElement>(':scope > li > a')[firstNew]?.focus()
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
        <ul ref={listRef} className={TILE_GRID}>
          {shown.map((item) => (
            <CatalogTile key={item.id} item={item} />
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-3 pt-4">
        {catalog.isPending && (
          <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Wczytujemy innowacje…
          </p>
        )}
        {catalog.isSuccess && shown.length < items.length && (
          <button
            type="button"
            onClick={showMore}
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <IconChevronDown aria-hidden="true" className="size-4" />
            Pokaż kolejne innowacje ({shown.length} z {items.length})
          </button>
        )}
        {catalog.isSuccess && shown.length >= items.length && (
          <p role="status" className="text-center text-sm text-muted-foreground">
            To wszystkie innowacje w tej kategorii ({items.length}).
          </p>
        )}
      </div>
    </section>
  )
}

function CatalogTile({ item }: { item: CatalogItem }) {
  return (
    <InnovationTile
      id={item.id}
      onClick={markFromCatalog}
      title={item.title}
      subtitle={item.subtitle ?? item.summary}
      categorySlug={item.categorySlug}
      hasVideo={item.hasVideo}
      featured={item.featured}
      sourceLabel="Biblioteka Innowacji ROPS"
    />
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
