import { useEffect, useRef, useState } from 'react'
import { IconAlertCircle, IconCheck, IconMail, IconMessage } from '@tabler/icons-react'
import { cn } from 'cn'
import { CONTACT_MODES, useContactRequest, type ContactMode } from '@/features/no-result/contact-form'
import { CTA, CTA_OUTLINE, FIELD, FOCUS } from '../kiosk-ui'

/**
 * Wersja kioskowa prośby o kontakt — panel inline, nie dialog. Base UI portaluje
 * dialogi do `document.body`, czyli poza poddrzewo `.kiosk`, gdzie straciłyby cały
 * motyw; dla dotykowego ekranu panel w treści jest i tak czytelniejszy.
 *
 * Walidacja i mutacja pochodzą z `features/no-result/contact-form.ts`, wspólnego
 * z wersją web. Różnica: tu nie ma checkboxa zgody (patrz TODO RODO w tamtym pliku).
 */
export function KioskContactForm({ query, gapId, onCancel }: { query: string; gapId: string | undefined; onCancel: () => void }) {
  const [mode, setMode] = useState<ContactMode>('phone')
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const savedRef = useRef<HTMLParagraphElement>(null)
  const { sentTo, submit, isError } = useContactRequest({ query, gapId })
  const [sending, setSending] = useState(false)

  const config = CONTACT_MODES[mode]

  // Formularz znika po zapisaniu razem z fokusowanym przyciskiem — przenieś fokus
  // na potwierdzenie, żeby czytnik ekranu nie został na usuniętym elemencie.
  useEffect(() => {
    if (sentTo) savedRef.current?.focus()
  }, [sentTo])

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-[28px] border border-border bg-card p-8">
        <IconCheck aria-hidden="true" className="size-12 text-[var(--hub-niebieski-ciemny)]" />
        <p ref={savedRef} tabIndex={-1} className="text-[calc(26px*var(--hub-skala))] font-bold outline-none">
          Zapisane. Damy znać, gdy pojawi się rozwiązanie.
        </p>
        <p className="hub-tekst-s text-[var(--hub-tekst-2)]">
          Odpowiedź wyślemy na <strong className="text-foreground">{sentTo}</strong>.
        </p>
      </div>
    )
  }

  function pick(next: ContactMode) {
    setMode(next)
    setContact('')
    setError(null)
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!config.valid(contact)) {
      setError(config.error)
      inputRef.current?.focus()
      return
    }
    setError(null)
    setSending(true)
    try {
      await submit(contact)
    } finally {
      setSending(false)
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5 rounded-[28px] border border-border bg-card p-8">
      <h2 id="hub-kontakt" className="text-[calc(26px*var(--hub-skala))] font-bold">
        Powiadom mnie, gdy pojawi się rozwiązanie
      </h2>

      <div role="group" aria-labelledby="hub-kontakt" className="grid grid-cols-2 gap-3">
        {(
          [
            ['phone', 'Telefon', IconMessage],
            ['email', 'E-mail', IconMail],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            onClick={() => pick(value)}
            className={cn(
              'hub-dotyk inline-flex h-15 items-center justify-center gap-3 rounded-full text-[22px] font-semibold',
              FOCUS,
              mode === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-7" />
            {label}
          </button>
        ))}
      </div>

      <label htmlFor="hub-kontakt-pole" className="hub-tekst-s font-semibold">
        {config.label}
      </label>
      <div className="flex items-center gap-3">
        {mode === 'phone' && (
          <span aria-hidden="true" className="text-[28px] font-semibold text-[var(--hub-tekst-2)]">
            +48
          </span>
        )}
        <input
          ref={inputRef}
          id="hub-kontakt-pole"
          type={config.type}
          inputMode={config.inputMode}
          autoComplete={config.autoComplete}
          placeholder={config.placeholder}
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'hub-kontakt-blad' : 'hub-kontakt-info'}
          className={cn(FIELD, 'h-[76px] text-[28px] aria-invalid:border-destructive')}
        />
      </div>

      {error && (
        <p id="hub-kontakt-blad" role="alert" className="hub-tekst-xs flex items-start gap-2 font-medium text-destructive">
          <IconAlertCircle aria-hidden="true" className="mt-1 size-6 shrink-0" />
          {error}
        </p>
      )}

      <p id="hub-kontakt-info" className="hub-tekst-xs text-muted-foreground">
        Użyjemy go tylko, żeby odpowiedzieć w tej sprawie.
      </p>

      {isError && (
        <p role="alert" className="hub-tekst-xs font-medium text-destructive">
          Nie udało się zapisać. Spróbuj ponownie za chwilę.
        </p>
      )}

      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={onCancel} className={cn(CTA_OUTLINE, 'h-[72px]')}>
          Anuluj
        </button>
        <button type="submit" disabled={sending} className={cn(CTA, 'h-[72px] text-[22px] disabled:opacity-50')}>
          {sending ? 'Zapisuję…' : 'Zapisz kontakt'}
        </button>
      </div>
    </form>
  )
}
