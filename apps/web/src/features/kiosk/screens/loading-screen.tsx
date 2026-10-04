import { Spinner } from '@/components/ui/spinner'

/**
 * Celowo minimalny. Tu wejdzie później animacja „Analizuję Twoją historię…" →
 * „Przeszukuję bazę sprawdzonych innowacji społecznych…" z prototypu; na razie
 * liczy się to, żeby czytnik ekranu ogłosił, że coś się dzieje.
 */
export function LoadingScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <Spinner aria-hidden="true" className="size-14 text-primary" />
      <p role="status" className="hub-tekst-l font-bold">
        Szukam rozwiązań…
      </p>
      <p className="hub-tekst-s text-[var(--hub-tekst-2)]">To potrwa kilka sekund.</p>
    </div>
  )
}
