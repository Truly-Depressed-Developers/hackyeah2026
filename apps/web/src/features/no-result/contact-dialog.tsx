import { useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertCircle, IconCheck, IconMail, IconMessage } from '@tabler/icons-react'
import { cn } from 'cn'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useT, type MessageKey } from '@/lib/i18n'
import { CONTACT_MODES as MODES, useContactRequest, webContactSchema, type WebContactValues } from './contact-form'

type FormValues = WebContactValues

// CONTACT_MODES keeps Polish copy for the kiosk; the web dialog reads the same fields from the dictionary.
const MODE_COPY: Record<FormValues['mode'], { label: MessageKey; placeholder: MessageKey; error: MessageKey }> = {
  email: { label: 'contact.emailLabel', placeholder: 'contact.emailPlaceholder', error: 'contact.emailError' },
  phone: { label: 'contact.phoneLabel', placeholder: 'contact.phonePlaceholder', error: 'contact.phoneError' },
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  gapId: string | undefined
  onFinish: () => void
}

export function ContactDialog({ open, onOpenChange, query, gapId, onFinish }: Props) {
  const t = useT()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const { send, sentTo, submit } = useContactRequest({ query, gapId })
  const form = useForm<FormValues>({
    resolver: zodResolver(webContactSchema),
    defaultValues: { mode: 'email', contact: '', consent: false },
    reValidateMode: 'onChange',
  })
  const modeKey = useWatch({ control: form.control, name: 'mode' })
  const mode = MODES[modeKey]
  const copy = MODE_COPY[modeKey]
  const { errors } = form.formState

  // The form (and its focused button) unmounts on success, so move focus to the thank-you heading.
  useEffect(() => {
    if (sentTo) titleRef.current?.focus()
  }, [sentTo])

  async function onSubmit(values: FormValues) {
    await submit(values.contact)
  }

  function pickMode(next: FormValues['mode']) {
    form.setValue('mode', next)
    form.setValue('contact', '')
    form.clearErrors('contact')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        initialFocus={titleRef}
        className="max-h-[calc(100svh-2rem)] gap-0 overflow-auto rounded-[2rem] bg-white px-6 pt-7 pb-7 text-base shadow-[0_40px_80px_-24px_rgb(15_27_45/0.45)] sm:max-w-[40rem] sm:px-[2.125rem] sm:pt-[1.875rem]"
      >
        {sentTo ? (
          <div role="status" className="flex flex-col items-center gap-3.5 pt-3 pb-1 text-center">
            <span aria-hidden="true" className="flex size-[4.75rem] items-center justify-center rounded-full bg-[#E2F4EC] text-[#0F6B4F]">
              <IconCheck className="size-9" />
            </span>
            <DialogTitle ref={titleRef} tabIndex={-1} className="mt-1 text-[1.875rem] leading-[2.375rem] font-[650] tracking-[-0.03em] outline-none">
              {t('contact.thanks')}
            </DialogTitle>
            <DialogDescription className="max-w-[32.5rem] text-[1.0625rem] leading-[1.625rem] text-[#3B4757]">
              {t('contact.sent')} <strong className="text-foreground">{sentTo}</strong>
            </DialogDescription>
            <button type="button" onClick={onFinish} className={cn(primaryPill, 'mt-2.5')}>
              {t('contact.home')}
            </button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[1.125rem] text-left">
            <div className="flex flex-col gap-2.5 pr-12">
              <DialogTitle ref={titleRef} tabIndex={-1} className="text-[1.625rem] leading-[2.125rem] font-[650] tracking-[-0.03em] outline-none sm:text-[1.875rem] sm:leading-[2.375rem]">
                {t('contact.title')}
              </DialogTitle>
              <DialogDescription className="text-[1.0625rem] leading-[1.625rem] text-[#3B4757]">
                {t('contact.lead')}
              </DialogDescription>
            </div>

            <div className="flex flex-col gap-1.5 rounded-2xl bg-muted px-[1.125rem] py-3.5">
              <span className="text-[0.8125rem] leading-[1.125rem] font-semibold text-muted-foreground">{t('contact.yourCase')}</span>
              <span className="text-[1.0625rem] leading-6">„{query}”</span>
            </div>

            <div className="flex flex-col gap-2.5">
              <span id="contact-mode-label" className="text-[0.9375rem] leading-5 font-semibold">
                {t('contact.how')}
              </span>
              <div role="group" aria-labelledby="contact-mode-label" className="flex h-[3.25rem] w-fit items-center gap-0.5 rounded-full bg-muted p-[3px]">
                {(
                  [
                    ['email', t('contact.modeEmail'), IconMail],
                    ['phone', t('contact.modePhone'), IconMessage],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={modeKey === value}
                    onClick={() => pickMode(value)}
                    className="inline-flex h-[2.875rem] items-center gap-2 rounded-full px-5 text-[0.9375rem] font-semibold text-secondary-foreground transition-colors hover:text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-white aria-pressed:text-primary-strong aria-pressed:shadow-[0_1px_3px_0_rgb(15_27_45/0.12),0_0_0_1px_rgb(34_99_173/0.25)]"
                  >
                    <Icon aria-hidden="true" className="size-[1.125rem]" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="contact-input" className="text-[0.9375rem] leading-5 font-semibold">
                {t(copy.label)}
              </label>
              <input
                id="contact-input"
                type={mode.type}
                inputMode={mode.inputMode}
                autoComplete={mode.autoComplete}
                placeholder={t(copy.placeholder)}
                aria-invalid={errors.contact ? true : undefined}
                aria-describedby={errors.contact ? 'contact-error' : undefined}
                {...form.register('contact')}
                className="h-[3.75rem] w-full rounded-full border border-input bg-white px-[1.375rem] text-lg outline-none placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_4px_rgb(34_99_173/0.18)] aria-invalid:border-[#D92D20] aria-invalid:bg-[#FFFBFA] aria-invalid:shadow-[0_0_0_4px_rgb(217_45_32/0.14)]"
              />
              {errors.contact && (
                <span id="contact-error" role="alert" className="flex items-start gap-2 px-1.5 text-[0.9375rem] leading-[1.375rem] font-medium text-[#B42318]">
                  <IconAlertCircle aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0" />
                  {t(copy.error)}
                </span>
              )}
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-[0.9375rem] leading-[1.375rem] text-[#3B4757]">
              <input
                type="checkbox"
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? 'consent-error' : undefined}
                {...form.register('consent')}
                className="size-6 shrink-0 cursor-pointer accent-primary"
              />
              <span>
                {t('contact.consent')}{' '}
                <a href="#" className="text-primary underline underline-offset-2">
                  {t('contact.privacyLink')}
                </a>
              </span>
            </label>
            {errors.consent && (
              <span id="consent-error" role="alert" className="-mt-3 flex items-start gap-2 pr-1.5 pl-9 text-[0.9375rem] leading-[1.375rem] font-medium text-[#B42318]">
                {t('contact.consentError')}
              </span>
            )}

            {send.isError && (
              <p role="alert" className="font-medium text-[#B42318]">
                {t('contact.sendError')}
              </p>
            )}

            <div className="flex flex-wrap justify-between gap-3">
              <button type="button" onClick={() => onOpenChange(false)} className={ghostPill}>
                {t('form.cancel')}
              </button>
              <button type="submit" disabled={form.formState.isSubmitting} className={primaryPill}>
                {form.formState.isSubmitting ? t('form.sending') : t('form.send')}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

const pill = 'inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-semibold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring'
const primaryPill = cn(pill, 'bg-primary text-primary-foreground shadow-[0_6px_14px_-6px_rgb(34_99_173/0.55)] hover:bg-primary-hover disabled:opacity-70')
const ghostPill = cn(pill, 'bg-muted text-[#1F2A3A] hover:bg-border')
