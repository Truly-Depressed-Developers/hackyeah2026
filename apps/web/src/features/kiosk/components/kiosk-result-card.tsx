import { IconChevronRight, IconMovie, IconSparkles } from '@tabler/icons-react'
import { cn } from 'cn'
import type { Result } from '@/lib/ai/client'
import { CARD } from '../kiosk-ui'
import { CategoryPill } from './category-pill'

/**
 * Cała karta jest jednym przyciskiem - bez zagnieżdżonych akcji. Na ekranie dotykowym
 * dwa cele w jednym kafelku to loteria, a dla czytnika ekranu zagnieżdżony przycisk
 * w przycisku jest nieprawidłowy. Wszystkie akcje czekają na ekranie szczegółu.
 *
 * Uwaga na kontrakt: `Result` NIE ma pola `featured`, więc odznaki „Polecana"
 * z prototypu nie da się tu pokazać - pojawia się dopiero na ekranie szczegółu,
 * który dostaje pełne `Innovation`.
 */
export function KioskResultCard({ result, tier, onOpen }: { result: Result; tier: 'solution' | 'related'; onOpen: () => void }) {
  const related = tier === 'related'

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn(CARD, related && 'min-h-[120px] gap-2 rounded-3xl bg-white/[0.78] p-5')}
      >
        <span className="flex w-full items-start justify-between gap-4">
          <CategoryPill slug={result.categorySlug} label={result.category} />
          <IconChevronRight aria-hidden="true" className="size-7 shrink-0" />
        </span>

        <span className={cn('font-bold', related ? 'hub-tekst-m' : 'text-[calc(28px*var(--hub-skala))] leading-[1.25]')}>
          {result.title}
        </span>

        <span className={cn('hub-tekst-s', related ? 'text-[var(--hub-tekst-2)]' : 'text-muted-foreground')}>
          {result.summary}
        </span>

        {!related && (
          <>
            <span className="hub-tekst-xs flex flex-col gap-1 rounded-2xl bg-muted/60 px-4 py-3 text-[var(--hub-tekst-2)]">
              <span>
                <span className="font-bold text-foreground">Dlaczego to pasuje: </span>
                {result.why}
              </span>
              {/* Nie podajemy tekstu LLM-a jako redakcyjnego - tak jak robi to wersja web. */}
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                {result.whyGenerated && <IconSparkles aria-hidden="true" className="size-5" />}
                {result.whyGenerated ? 'Uzasadnienie wygenerowane przez AI' : 'Uzasadnienie dopasowania'}
              </span>
            </span>

            <span className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[calc(18px*var(--hub-skala))] text-muted-foreground">
              {result.links?.video && (
                /* Sam sygnał, że film czeka na ekranie szczegółu - tu nie ma odtwarzacza. */
                <span className="inline-flex items-center gap-2">
                  <IconMovie aria-hidden="true" className="size-5" />
                  Film
                </span>
              )}
              <span>{result.source.label}</span>
            </span>
          </>
        )}
      </button>
    </li>
  )
}
