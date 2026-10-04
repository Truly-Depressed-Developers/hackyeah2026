import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconDeviceMobileMessage, IconPrinter, IconQrcode } from '@tabler/icons-react'
import { cn } from 'cn'
import { QrCode } from '@/components/innovation/qr-code'
import { isPhone } from '@/lib/contact'
import { CTA, CTA_MUTED, CTA_OUTLINE, FIELD, TILE } from '../kiosk-ui'

/**
 * Druk i SMS to na razie sam front — rozwiązują się na timerze, bez backendu.
 *
 * W dev są widoczne domyślnie, żeby dało się nad nimi pracować. W buildzie
 * produkcyjnym trzeba je włączyć jawnie: powiedzenie realnemu mieszkańcowi
 * „Wysłano SMS", gdy nic nie wyszło, to utrata zaufania, a nie skrót demowy.
 * Kod QR działa naprawdę i jest dostępny zawsze.
 */
const DEMO = import.meta.env.DEV || import.meta.env.VITE_KIOSK_DEMO === 'true'

/** Origin kiosku bywa localhost albo adresem w LAN-ie, którego telefon nie otworzy. */
const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL ?? window.location.origin

const SIMULATED_MS = 2200

type Takeaway =
  | { kind: 'none' }
  | { kind: 'print'; done: boolean }
  | { kind: 'sms'; phase: 'form' | 'sending' | 'sent'; number: string }
  | { kind: 'qr' }

export function Takeaway({ id, title }: { id: string; title: string }) {
  const [state, setState] = useState<Takeaway>({ kind: 'none' })
  const headingId = 'hub-odbior'

  return (
    /*
     * Etykieta sekcji to akapit, nie nagłówek. Odbiór stoi nad tytułem innowacji,
     * więc <h2> dałoby nagłówek przed <h1> i skok h1→h3 w panelach niżej.
     * `aria-labelledby` nadaje sekcji nazwę bez wchodzenia w hierarchię nagłówków.
     */
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <p id={headingId} className="text-[calc(26px*var(--hub-skala))] font-bold">
        Jak chcesz odebrać szczegóły i adres?
      </p>

      {state.kind === 'none' && (
        <div className="grid grid-cols-3 gap-4">
          {DEMO && (
            <>
              <Option icon={IconPrinter} label="Wydrukuj" hint="Kartka z adresem i opisem" onClick={() => setState({ kind: 'print', done: false })} />
              <Option icon={IconDeviceMobileMessage} label="SMS" hint="Wyślę na Twój telefon" onClick={() => setState({ kind: 'sms', phase: 'form', number: '' })} />
            </>
          )}
          <Option icon={IconQrcode} label="Kod QR" hint="Zeskanujesz telefonem" onClick={() => setState({ kind: 'qr' })} />
        </div>
      )}

      {state.kind !== 'none' && (
        <p className="hub-tekst-s text-[var(--hub-tekst-2)]">
          <span className="font-semibold text-foreground">Wybrane rozwiązanie: </span>
          {title}
        </p>
      )}

      {state.kind === 'print' && <Print done={state.done} onDone={() => setState({ kind: 'print', done: true })} onBack={() => setState({ kind: 'none' })} />}
      {state.kind === 'sms' && <Sms state={state} setState={setState} />}
      {state.kind === 'qr' && <Qr id={id} onBack={() => setState({ kind: 'none' })} />}
    </section>
  )
}

function Option({ icon: Icon, label, hint, onClick }: { icon: typeof IconPrinter; label: string; hint: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn(TILE, 'min-h-[184px] justify-center rounded-[28px] bg-card')}>
      <Icon aria-hidden="true" className="size-12 text-[var(--hub-niebieski-ciemny)]" />
      <span className="hub-tekst-m font-bold">{label}</span>
      <span className="hub-tekst-xs text-[var(--hub-tekst-2)]">{hint}</span>
    </button>
  )
}

function Print({ done, onDone, onBack }: { done: boolean; onDone: () => void; onBack: () => void }) {
  useSimulatedDelay(!done, onDone)

  return (
    <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-card p-8 text-center">
      <IconPrinter aria-hidden="true" className="size-14 text-[var(--hub-niebieski-ciemny)]" />
      <p role="status" className="text-[32px] font-bold">
        {done ? 'Gotowe — kartka czeka' : 'Drukuję kartkę z adresem…'}
      </p>
      <p className="hub-tekst-s text-[var(--hub-tekst-2)]">Odbierz ją z drukarki pod ekranem.</p>
      <DemoNote />
      {done && (
        <button type="button" onClick={onBack} className={CTA_MUTED}>
          Wybierz inny sposób
        </button>
      )}
    </div>
  )
}

function Sms({ state, setState }: { state: Extract<Takeaway, { kind: 'sms' }>; setState: (next: Takeaway) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const valid = isPhone(state.number)

  // Panel zastąpił kafelek, który go otworzył, więc fokus musi za nim pójść —
  // inaczej czytnik ekranu zostałby na elemencie, którego już nie ma.
  useEffect(() => {
    if (state.phase === 'form') inputRef.current?.focus()
  }, [state.phase])

  useSimulatedDelay(state.phase === 'sending', () => setState({ ...state, phase: 'sent' }))

  if (state.phase === 'sent') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-card p-8 text-center">
        <IconCheck aria-hidden="true" className="size-14 text-[var(--hub-niebieski-ciemny)]" />
        <p role="status" className="text-[calc(26px*var(--hub-skala))] font-bold">
          Wysłano SMS
        </p>
        <p className="hub-tekst-s text-[var(--hub-tekst-2)]">
          Adres i opis są już w drodze na numer kończący się na {state.number.slice(-3)}.
        </p>
        <DemoNote />
      </div>
    )
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-[28px] border border-border bg-card p-8"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid) setState({ ...state, phase: 'sending' })
      }}
    >
      <p className="text-[calc(26px*var(--hub-skala))] font-bold">Wyślę SMS z adresem i opisem</p>

      <label htmlFor="hub-telefon" className="hub-tekst-s font-semibold">
        Numer telefonu
      </label>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="text-[28px] font-semibold text-[var(--hub-tekst-2)]">
          +48
        </span>
        <input
          ref={inputRef}
          id="hub-telefon"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={state.number}
          onChange={(event) => setState({ ...state, number: event.target.value })}
          placeholder="np. 123 456 789"
          aria-describedby="hub-sms-info"
          className={cn(FIELD, 'h-[76px] text-[32px]')}
        />
      </div>
      <p id="hub-sms-info" className="hub-tekst-xs text-muted-foreground">
        Numer służy tylko do wysłania tej wiadomości. Po wysłaniu usunę go z kiosku.
      </p>
      <DemoNote />

      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={() => setState({ kind: 'none' })} className={CTA_OUTLINE}>
          Anuluj
        </button>
        <button type="submit" disabled={!valid || state.phase === 'sending'} className={cn(CTA, 'h-[72px] text-[22px] disabled:opacity-50')}>
          {state.phase === 'sending' ? 'Wysyłam…' : 'Wyślij SMS'}
        </button>
      </div>
    </form>
  )
}

function Qr({ id, onBack }: { id: string; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[28px] border border-border bg-card p-8 text-center">
      <p className="text-[calc(28px*var(--hub-skala))] font-bold">Zeskanuj kod aparatem w telefonie</p>
      <QrCode
        value={`${PUBLIC_URL}/innowacja/${encodeURIComponent(id)}`}
        label="Kod QR z adresem strony tej innowacji"
        className="size-64"
      />
      <p className="hub-tekst-s text-[var(--hub-tekst-2)]">
        Otworzysz opis i adres na swoim telefonie. Kod nie zawiera Twoich danych.
      </p>
      <button type="button" onClick={onBack} className={CTA_MUTED}>
        Wybierz inny sposób
      </button>
    </div>
  )
}

/** Żeby nikt nie wziął symulacji za działającą usługę — ani mieszkaniec, ani zespół. */
function DemoNote() {
  return (
    <p className="hub-tekst-xs rounded-2xl bg-[var(--hub-bursztyn-jasny)] px-4 py-2 text-[var(--hub-bursztyn)]">
      Tryb demonstracyjny — nic nie zostało naprawdę wysłane ani wydrukowane.
    </p>
  )
}

function useSimulatedDelay(active: boolean, onDone: () => void) {
  const latest = useRef(onDone)
  useEffect(() => {
    latest.current = onDone
  })

  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => latest.current(), SIMULATED_MS)
    return () => clearTimeout(timer)
  }, [active])
}
