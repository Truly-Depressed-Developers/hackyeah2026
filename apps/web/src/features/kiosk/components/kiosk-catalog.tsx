import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { IconChevronDown, IconChevronRight, IconMovie, IconRosetteDiscountCheck } from '@tabler/icons-react'
import { cn } from 'cn'
import { CategoryIcon } from '@/components/category-badge'
import { interleaveByCategory } from '@/components/catalog/knowledge-base'
import { Spinner } from '@/components/ui/spinner'
import { $ai, type CatalogItem } from '@/lib/ai/client'
import { ALL_CATEGORIES, CATEGORIES } from '@/lib/categories'
import { CARD, CTA_MUTED, FOCUS } from '../kiosk-ui'
import { CategoryPill } from './category-pill'
import type { CarriedResult } from '../use-kiosk-session'

/** Mniej niż w wersji web (12), bo kafelki kiosku są dużo wyższe. */
const FIRST_PAGE = 6
const NEXT_PAGE = 6

/**
 * Katalog na ekranie startowym — żeby kiosk nie witał mieszkańca pustą przestrzenią
 * i żeby dało się czegoś dotknąć bez wymyślania słów. Te same dane co „Baza wiedzy"
 * w wersji web, tylko w układzie pod palec.
 *
 * Nagłówek celowo NIE brzmi „Najczęściej wybierane w tym kiosku", jak w prototypie:
 * nie mamy ani statystyk użycia, ani lokalizacji urządzenia, więc byłaby to obietnica
 * bez pokrycia. Wróci razem z S-09 (kiosk-start-recommendations).
 */
export function KioskCatalog({ onOpen }: { onOpen: (result: CarriedResult) => void }) {
  const catalog = $ai.useQuery('get', '/catalog', {}, { staleTime: 10 * 60_000, retry: false })
  const [filter, setFilter] = useState(ALL_CATEGORIES.slug)
  const [visible, setVisible] = useState(FIRST_PAGE)
  const listRef = useRef<HTMLUListElement>(null)

  const all = catalog.data?.items ?? []
  const items = filter === ALL_CATEGORIES.slug ? interleaveByCategory(all) : all.filter((item) => item.categorySlug === filter)
  const shown = items.slice(0, visible)

  function pick(slug: string) {
    setFilter(slug)
    setVisible(FIRST_PAGE)
  }

  // Fokus na pierwszy dołożony kafelek, żeby klawiatura nie wracała na początek listy.
  function showMore() {
    const firstNew = visible
    flushSync(() => setVisible((count) => count + NEXT_PAGE))
    listRef.current?.querySelectorAll<HTMLElement>(':scope > li > button')[firstNew]?.focus()
  }

  return (
    <section aria-labelledby="hub-katalog" className="flex flex-col gap-5 border-t border-border pt-10">
      <div className="flex flex-col gap-2">
        <h2 id="hub-katalog" className="text-[calc(26px*var(--hub-skala))] font-bold">
          Sprawdzone rozwiązania z Małopolski
        </h2>
        <p className="hub-tekst-xs text-[var(--hub-tekst-2)]">Dotknij, żeby zobaczyć szczegóły — albo opisz swoją sprawę wyżej.</p>
      </div>

      <div
        role="group"
        aria-label="Filtruj według kategorii"
        className="hub-przewijanie -mx-2 flex gap-3 overflow-x-auto px-2 pb-2"
      >
        {[ALL_CATEGORIES, ...CATEGORIES].map((category) => (
          <button
            key={category.slug}
            type="button"
            aria-pressed={filter === category.slug}
            onClick={() => pick(category.slug)}
            style={filter === category.slug ? { background: category.tint } : undefined}
            className={cn(
              'hub-dotyk inline-flex h-14 shrink-0 items-center gap-2.5 rounded-full bg-muted py-0 pr-6 pl-2 text-[20px] font-medium whitespace-nowrap text-[var(--hub-tekst-2)]',
              FOCUS,
              'aria-pressed:font-semibold aria-pressed:text-foreground aria-pressed:shadow-[inset_0_0_0_1px_rgb(15_27_45/0.08)]',
            )}
          >
            <CategoryIcon category={category} />
            {category.label}
          </button>
        ))}
      </div>

      {catalog.isError ? (
        <div role="alert" className="flex flex-col items-start gap-4 rounded-[28px] border border-destructive p-6">
          <p className="hub-tekst-s font-semibold text-destructive">Nie udało się wczytać rozwiązań.</p>
          <button type="button" onClick={() => catalog.refetch()} className={CTA_MUTED}>
            Spróbuj ponownie
          </button>
        </div>
      ) : (
        <ul ref={listRef} className="flex flex-col gap-4">
          {shown.map((item) => (
            <CatalogRow key={item.id} item={item} onOpen={() => onOpen({ id: item.id, title: item.title })} />
          ))}
        </ul>
      )}

      <div className="flex flex-col items-center gap-3">
        {catalog.isPending && (
          <p role="status" className="hub-tekst-xs flex items-center gap-3 text-muted-foreground">
            <Spinner aria-hidden="true" />
            Wczytuję rozwiązania…
          </p>
        )}
        {catalog.isSuccess && shown.length < items.length && (
          <button type="button" onClick={showMore} className={CTA_MUTED}>
            <IconChevronDown aria-hidden="true" className="size-6" />
            Pokaż kolejne ({shown.length} z {items.length})
          </button>
        )}
      </div>
    </section>
  )
}

function CatalogRow({ item, onOpen }: { item: CatalogItem; onOpen: () => void }) {
  return (
    <li>
      {/* Cała karta to jeden przycisk — bez zagnieżdżonych akcji, jak na wynikach. */}
      <button type="button" onClick={onOpen} className={cn(CARD, 'min-h-[128px] gap-2 rounded-3xl p-5')}>
        <span className="flex w-full items-start justify-between gap-4">
          <CategoryPill slug={item.categorySlug} label={item.category} />
          <IconChevronRight aria-hidden="true" className="size-7 shrink-0" />
        </span>

        <span className="hub-tekst-m font-bold">{item.title}</span>
        <span className="hub-tekst-xs line-clamp-3 text-[var(--hub-tekst-2)]">{item.subtitle ?? item.summary}</span>

        {(item.hasVideo || item.featured) && (
          <span className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[calc(18px*var(--hub-skala))] text-muted-foreground">
            {item.hasVideo && (
              <span className="inline-flex items-center gap-2">
                <IconMovie aria-hidden="true" className="size-5" />
                Film
              </span>
            )}
            {/* W przeciwieństwie do `Result`, `CatalogItem` niesie `featured`. */}
            {item.featured && (
              <span className="inline-flex items-center gap-2 font-semibold text-[#7a4300]">
                <IconRosetteDiscountCheck aria-hidden="true" className="size-5" />
                Polecana
              </span>
            )}
          </span>
        )}
      </button>
    </li>
  )
}
