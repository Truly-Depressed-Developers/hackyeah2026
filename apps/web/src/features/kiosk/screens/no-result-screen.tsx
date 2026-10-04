import { useState } from 'react'
import { IconArrowLeft, IconBellPlus } from '@tabler/icons-react'
import { cn } from 'cn'
import { useGap } from '@/features/no-result/use-gap'
import { KioskContactForm } from '../components/kiosk-contact-form'
import { CTA, CTA_MUTED } from '../kiosk-ui'
import { ScreenTitle } from '../screen-title'

export function NoResultScreen({ query, onBack }: { query: string; onBack: () => void }) {
  // Zapisuje lukę w wiedzy (sygnał dla ROPS) raz na zapytanie - dedup siedzi w hooku.
  const gapId = useGap(query)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-4">
        <ScreenTitle>Nie mamy jeszcze rozwiązania dla tej sprawy</ScreenTitle>
        <p className="hub-tekst-m text-[var(--hub-tekst-2)]">
          Przekażę Twoją sprawę do Regionalnego Ośrodka Polityki Społecznej w Krakowie. Zespół sprawdzi, jak można pomóc.
        </p>
        <p className="hub-tekst-xs text-[var(--hub-tekst-2)]">
          <span className="font-semibold text-foreground">Szukałem dla: </span>„{query}”
        </p>
      </div>

      {showForm ? (
        <KioskContactForm query={query} gapId={gapId} onCancel={() => setShowForm(false)} />
      ) : (
        <div className="flex flex-col gap-4 rounded-[28px] border border-border bg-card p-8">
          <IconBellPlus aria-hidden="true" className="size-12 text-[var(--hub-niebieski-ciemny)]" />
          <h2 className="text-[calc(26px*var(--hub-skala))] font-bold">Powiadom mnie, gdy pojawi się rozwiązanie</h2>
          <p className="hub-tekst-s text-[var(--hub-tekst-2)]">
            Zostaw e-mail lub numer telefonu. Damy znać, gdy znajdziemy odpowiedź na Twoją sprawę.
          </p>
          <button type="button" onClick={() => setShowForm(true)} className={cn(CTA, 'h-16 self-start text-[22px]')}>
            Zostaw kontakt
          </button>
        </div>
      )}

      <button type="button" onClick={onBack} className={cn(CTA_MUTED, 'h-[72px] self-start text-[24px]')}>
        <IconArrowLeft aria-hidden="true" className="size-7" />
        Opisz inaczej
      </button>
    </div>
  )
}
