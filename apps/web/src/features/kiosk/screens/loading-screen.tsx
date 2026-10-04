import { SearchingGlass } from '@/features/search-progress/searching-glass'
import { useSearchProgress } from '@/features/search-progress/use-search-progress'

/**
 * Kilka sekund ciszy na kiosku wygląda jak zawieszony ekran, a mieszkaniec stoi
 * i czeka. Narracja mówi, co się dzieje, zamiast udawać pasek postępu.
 */
export function LoadingScreen({ query }: { query: string }) {
  const phase = useSearchProgress()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
      <SearchingGlass className="size-56" />

      <div className="flex flex-col gap-3">
        {/* Jedna żywa treść: dwa komunikaty na całe szukanie to nie jest zalewanie czytnika. */}
        <p role="status" className="text-[34px] leading-tight font-bold">
          {phase}
        </p>
        <p className="hub-tekst-s text-[var(--hub-tekst-2)]">To potrwa kilka sekund.</p>
      </div>

      <p className="hub-tekst-xs max-w-[34rem] text-[var(--hub-tekst-2)]">
        <span className="font-semibold text-foreground">Szukam dla: </span>„{query}”
      </p>
    </div>
  )
}
