import { IconX } from '@tabler/icons-react'
import { cn } from 'cn'
import { FOCUS, PILL } from './kiosk-ui'
import { SKALE } from './use-kiosk-session'

/** Glify rosną razem z krokiem skali, żeby przycisk pokazywał, co robi. */
const GLYPH = ['text-[20px]', 'text-[25px]', 'text-[31px]']
const LABEL = ['Tekst normalny', 'Tekst większy', 'Tekst największy']

interface KioskHeaderProps {
  skala: number
  onSkala: (skala: number) => void
  onEnd: () => void
}

export function KioskHeader({ skala, onSkala, onEnd }: KioskHeaderProps) {
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

        {/* Samo „Zakończ" nie mówi, co się stanie — nazwa dostępna to dopowiada. */}
        <button type="button" aria-label="Zakończ i wyczyść ekran" onClick={onEnd} className={cn(PILL, 'pr-7 pl-5')}>
          <IconX aria-hidden="true" className="size-6" />
          Zakończ
        </button>
      </div>
    </header>
  )
}
