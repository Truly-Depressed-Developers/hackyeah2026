import { IconAlertTriangle, IconArrowLeft, IconRefresh } from '@tabler/icons-react'
import { cn } from 'cn'
import { CTA, CTA_MUTED } from '../kiosk-ui'
import { ScreenTitle } from '../screen-title'

/**
 * `openapi-fetch` nie zwraca strukturalnego ciała błędu, a klient `$ai` przerywa
 * żądanie po 10 s własnym `AbortSignal.timeout`. Rozróżniamy więc tylko te dwa
 * przypadki, które da się wiarygodnie rozpoznać, i mówimy o nich po ludzku.
 */
function copyFor(error: unknown) {
  const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
  return timedOut
    ? {
        title: 'Szukanie trwało zbyt długo',
        description: 'Połączenie jest teraz wolne. Spróbuj jeszcze raz — zwykle pomaga.',
      }
    : {
        title: 'Nie udało się wyszukać',
        description: 'Coś po naszej stronie nie zadziałało. Twój opis jest bezpieczny, możesz spróbować ponownie.',
      }
}

interface ErrorScreenProps {
  error: unknown
  query: string
  onRetry: () => void
  onBack: () => void
}

export function ErrorScreen({ error, query, onRetry, onBack }: ErrorScreenProps) {
  const { title, description } = copyFor(error)

  return (
    <div role="alert" className="flex flex-col gap-8 pt-4">
      <div className="flex flex-col gap-4">
        <IconAlertTriangle aria-hidden="true" className="size-16 text-[var(--hub-bursztyn)]" />
        <ScreenTitle>{title}</ScreenTitle>
        <p className="hub-tekst-m text-[var(--hub-tekst-2)]">{description}</p>
      </div>

      <p className="hub-tekst-xs text-[var(--hub-tekst-2)]">
        <span className="font-semibold text-foreground">Twój opis:</span> „{query}”
      </p>

      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={onRetry} className={cn(CTA, 'h-[76px]')}>
          <IconRefresh aria-hidden="true" className="size-7" />
          Spróbuj ponownie
        </button>
        <button type="button" onClick={onBack} className={cn(CTA_MUTED, 'h-[68px]')}>
          <IconArrowLeft aria-hidden="true" className="size-6" />
          Wróć do opisu
        </button>
      </div>

      <p className="hub-tekst-xs text-[var(--hub-tekst-2)]">Jeśli to się powtarza, poproś o pomoc obsługę punktu.</p>
    </div>
  )
}
