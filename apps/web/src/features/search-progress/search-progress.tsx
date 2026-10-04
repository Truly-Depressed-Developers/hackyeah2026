import { SearchingGlass } from './searching-glass'
import { useSearchProgress } from './use-search-progress'
import { useT } from '@/lib/i18n'

/**
 * Stan szukania w wersji web. Zastępuje samo „Szukam rozwiązań…" — zapytanie
 * semantyczne idzie do zewnętrznej usługi i potrafi trwać kilka sekund, a goła linijka
 * tekstu nie odróżnia tego od zawieszonej strony.
 */
export function SearchProgress() {
  const t = useT()
  const phase = useSearchProgress()

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card px-6 py-10 text-center">
      <SearchingGlass className="size-28" />

      <div className="flex flex-col gap-1.5">
        <p role="status" className="text-lg font-semibold">
          {phase}
        </p>
        <p className="text-muted-foreground">{t('progress.fewSeconds')}</p>
      </div>
    </div>
  )
}
