import { IconX } from '@tabler/icons-react'
import { cn } from 'cn'
import { FOCUS, PILL } from './kiosk-ui'
import { SKALE } from './use-kiosk-session'

/** Glify rosną razem z krokiem skali, żeby przycisk pokazywał, co robi. */
const GLYPH = ['text-[20px]', 'text-[25px]', 'text-[31px]']
const LABEL = ['Tekst normalny', 'Tekst większy', 'Tekst największy']

interface KioskHeaderProps {
  skala: number
  /** Fałsz na świeżym ekranie startowym — nie ma wtedy czego czyścić. */
  canEnd: boolean
  onSkala: (skala: number) => void
  onEnd: () => void
}

export function KioskHeader({ skala, canEnd, onSkala, onEnd }: KioskHeaderProps) {
  return (
    <header className="hub-pasek absolute inset-x-8 top-6 z-10 flex h-22 items-center justify-between gap-4">
      <span className="text-[30px] font-bold tracking-[-0.02em]">HubMI</span>

      <div className="flex items-center gap-4">
        <div role="group" aria-labelledby="kiosk-skala-label" className="flex items-center gap-2">
          <span id="kiosk-skala-label" className="text-[20px] text-[var(--hub-tekst-2)]">
            Tekst
          </span>
          {SKALE.map((value, i) => (
            <button
              key={value}
              type="button"
              aria-label={LABEL[i]}
              aria-pressed={skala === value}
              onClick={() => onSkala(value)}
              className={cn(
                'hub-dotyk flex size-14 items-center justify-center rounded-full font-semibold',
                GLYPH[i],
                FOCUS,
                skala === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
              )}
            >
              A
            </button>
          ))}
        </div>

        {/*
          Przycisk zostaje na miejscu także wtedy, gdy nie ma czego czyścić — tylko
          wyszarzony. Znikający element przesuwałby cały pasek i mieszkaniec musiałby
          za nim wodzić wzrokiem; na ekranie dotykowym stałe położenie jest ważniejsze
          niż oszczędność miejsca.

          Samo „Zakończ" nie mówi, co się stanie — nazwa dostępna to dopowiada.
        */}
        <button
          type="button"
          aria-label="Zakończ i wyczyść ekran"
          disabled={!canEnd}
          onClick={onEnd}
          // Wyszarzenie przez kolory, nie `opacity`: półprzezroczysty tekst schodził
          // do ~2,5:1 i był po prostu nieczytelny z odległości wyciągniętej ręki.
          className={cn(PILL, 'pr-7 pl-5 disabled:border-input disabled:bg-muted disabled:text-muted-foreground')}
        >
          <IconX aria-hidden="true" className="size-6" />
          Zakończ
        </button>
      </div>
    </header>
  )
}
