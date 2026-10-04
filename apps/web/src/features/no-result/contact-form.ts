import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { isEmail, isPhone } from '@/lib/contact'
import { trpc } from '@/lib/trpc'

/**
 * Jeden sposób kontaktu, przełączany segmentem — nie dwa pola naraz. Komunikaty
 * błędów są współdzielone przez wersję web i kiosk, żeby mieszkaniec dostał to samo
 * zdanie niezależnie od tego, gdzie trafił.
 */
export const CONTACT_MODES = {
  email: {
    label: 'Adres e-mail',
    type: 'email',
    inputMode: 'email',
    autoComplete: 'email',
    placeholder: 'np. jan.kowalski@poczta.pl',
    error: 'To nie wygląda na poprawny adres e-mail. Sprawdź, czy zawiera znak @ i końcówkę, np. .pl lub .com.',
    valid: isEmail,
  },
  phone: {
    label: 'Numer telefonu',
    type: 'tel',
    inputMode: 'tel',
    autoComplete: 'tel',
    placeholder: 'np. 600 123 456',
    error: 'Numer telefonu powinien mieć 9 cyfr, np. 600 123 456.',
    valid: isPhone,
  },
} as const

export type ContactMode = keyof typeof CONTACT_MODES

const modeField = z.enum(['email', 'phone'])
const contactField = z.string().trim()

function withContactCheck<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).superRefine((values, ctx) => {
    const mode = (values as { mode: ContactMode; contact: string }).mode
    const contact = (values as { mode: ContactMode; contact: string }).contact
    if (!CONTACT_MODES[mode].valid(contact)) {
      ctx.addIssue({ code: 'custom', path: ['contact'], message: CONTACT_MODES[mode].error })
    }
  })
}

/**
 * Kiosk: brak checkboxa zgody. W designie aktem afirmatywnym jest samo naciśnięcie
 * „Zapisz kontakt" pod zdaniem o tym, do czego użyjemy numeru — a `consentAt` i tak
 * trafia do API w obu wariantach.
 *
 * TODO (RODO): zespół ma potwierdzić, czy przycisk wystarcza jako zgoda przy kiosku,
 * czy kiosk też musi mieć jawny checkbox. Do czasu decyzji oba warianty żyją obok siebie.
 */
export const contactSchema = withContactCheck({ mode: modeField, contact: contactField })

/** Wersja web: zgoda jest jawnym checkboxem i bez niej formularz nie przechodzi. */
export const webContactSchema = withContactCheck({
  mode: modeField,
  contact: contactField,
  consent: z.boolean().refine(Boolean, 'Zaznacz zgodę, abyśmy mogli się z Tobą skontaktować.'),
})

export type ContactValues = z.infer<typeof contactSchema>
export type WebContactValues = z.infer<typeof webContactSchema>

interface UseContactRequestOptions {
  query: string
  gapId: string | undefined
  shownResults?: { id: string; title: string; tier: 'solution' | 'related' }[]
}

/**
 * Wysyłka prośby o kontakt. Headless — markup należy do powierzchni (dialog w web,
 * panel inline w kiosku), bo layouty nie mają ze sobą nic wspólnego.
 */
export function useContactRequest({ query, gapId, shownResults = [] }: UseContactRequestOptions) {
  const [sentTo, setSentTo] = useState<string | null>(null)
  const send = useMutation(trpc.needs.requestContact.mutationOptions())

  async function submit(contact: string) {
    await send.mutateAsync({
      query,
      gapId,
      shownResults,
      contact,
      // Zgoda powstaje w momencie wysłania formularza, nie wcześniej.
      consentAt: new Date(),
    })
    setSentTo(contact)
  }

  return { send, sentTo, submit, isError: send.isError }
}
