import { IconKeyboard, IconMicrophone } from '@tabler/icons-react'
import { cn } from 'cn'
import { FOCUS, TILE } from '../kiosk-ui'
import type { KioskMode } from '../use-kiosk-session'

const MODES = [
  { id: 'napisz', icon: IconKeyboard, label: 'Napisz', hint: 'Duża klawiatura na ekranie' },
  { id: 'powiedz', icon: IconMicrophone, label: 'Powiedz', hint: 'Mów swoimi słowami' },
] as const satisfies readonly { id: KioskMode; icon: typeof IconKeyboard; label: string; hint: string }[]

/**
 * Wybór sposobu opisania sprawy. Dopóki mieszkaniec nic nie wybrał, obie opcje są
 * równorzędnymi kafelkami 216 px - na kiosku głos nie jest dodatkiem do pisania,
 * tylko drugą pełnoprawną drogą. Po wyborze zwijają się w przełącznik, żeby oddać
 * miejsce polu opisu.
 */
export function ModeTiles({ mode, onChoose }: { mode: KioskMode | null; onChoose: (mode: KioskMode) => void }) {
  if (mode === null) {
    return (
      <div role="group" aria-label="Jak chcesz opisać swoją sprawę?" className="grid grid-cols-2 gap-5">
        {MODES.map(({ id, icon: Icon, label, hint }) => (
          <button key={id} type="button" onClick={() => onChoose(id)} className={cn(TILE, 'min-h-[216px] justify-center')}>
            <Icon aria-hidden="true" className="size-14 text-primary" />
            <span className="text-[30px] font-bold">{label}</span>
            <span className="hub-tekst-xs text-muted-foreground">{hint}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div role="group" aria-label="Jak chcesz opisać swoją sprawę?" className="grid grid-cols-2 gap-3">
      {MODES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          aria-pressed={mode === id}
          onClick={() => onChoose(id)}
          className={cn(
            'hub-dotyk inline-flex h-15 items-center justify-center gap-3 rounded-full text-[22px] font-semibold',
            FOCUS,
            mode === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
          )}
        >
          <Icon aria-hidden="true" className="size-7" />
          {label}
        </button>
      ))}
    </div>
  )
}
