import { useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { IconCheck, IconInfoCircle } from '@tabler/icons-react'
import { cn } from 'cn'
import { FieldErrorText, fieldClass, ghostButton, labelClass, primaryButton } from '@/components/resident/controls'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { isEmail } from '@/lib/contact'
import { useT } from '@/lib/i18n'
import { AdvisorHttpError, sendAdvisorEmail } from './advisor-stream'

interface EmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  query: string
  markdown: string
}

export function EmailDialog({ open, onOpenChange, query, markdown }: EmailDialogProps) {
  const t = useT()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [email, setEmail] = useState('')
  const [org, setOrg] = useState('')
  const [invalid, setInvalid] = useState(false)
  const send = useMutation({ mutationFn: sendAdvisorEmail })

  function changeOpen(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setInvalid(false)
      send.reset()
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isEmail(email.trim())) {
      setInvalid(true)
      document.getElementById('advisor-email')?.focus()
      return
    }
    send.mutate({ email: email.trim(), name: org.trim() || undefined, query, markdown }, { onSuccess: () => titleRef.current?.focus() })
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent
        initialFocus={titleRef}
        className="max-h-[calc(100svh-2rem)] gap-0 overflow-auto rounded-[1.75rem] bg-white px-6 pt-7 pb-7 text-base shadow-[0_40px_80px_-24px_rgb(15_27_45/0.45)] sm:max-w-[37.5rem] sm:px-8 sm:pt-[1.875rem]"
      >
        {send.isSuccess ? (
          <div role="status" className="flex flex-col items-center gap-3.5 pt-2 pb-1 text-center">
            <span
              aria-hidden="true"
              className={cn(
                'flex size-[4.5rem] items-center justify-center rounded-full',
                send.data.demo ? 'bg-[#FFF7E6] text-[#7A4B00]' : 'bg-[#E2F4EC] text-[#0F6B4F]',
              )}
            >
              {send.data.demo ? <IconInfoCircle className="size-9" /> : <IconCheck className="size-9" />}
            </span>
            <DialogTitle ref={titleRef} tabIndex={-1} className="text-2xl leading-[1.9375rem] font-[650] outline-none">
              {send.data.demo ? t('advisor.email.demoTitle') : t('advisor.email.sentTitle')}
            </DialogTitle>
            <DialogDescription className="text-base leading-6 text-[#3B4757]">
              {send.data.demo ? (
                <>
                  {t('advisor.email.demoBefore')}{' '}
                  <strong className="text-foreground">{email.trim()}</strong>
                  {t('advisor.email.demoAfter')}
                </>
              ) : (
                <>
                  {t('advisor.email.sentBefore')} <strong className="text-foreground">{email.trim()}</strong>
                  {t('advisor.email.sentAfter')}
                </>
              )}
            </DialogDescription>
            <button type="button" onClick={() => changeOpen(false)} className={cn(primaryButton, 'mt-1.5')}>
              {t('advisor.email.done')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="flex flex-col gap-[1.125rem] text-left">
            <div className="flex flex-col gap-1.5 pr-12">
              <DialogTitle ref={titleRef} tabIndex={-1} className="text-2xl leading-[1.9375rem] font-[650] tracking-[-0.02em] outline-none">
                {t('advisor.email.title')}
              </DialogTitle>
              <DialogDescription className="text-base leading-6 text-[#3B4757]">{t('advisor.email.description')}</DialogDescription>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="advisor-email" className={labelClass}>
                {t('advisor.email.address')}
              </label>
              <input
                id="advisor-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder={t('advisor.email.addressPlaceholder')}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setInvalid(false)
                }}
                aria-invalid={invalid || undefined}
                aria-describedby={invalid ? 'advisor-email-error' : undefined}
                className={fieldClass}
              />
              <FieldErrorText
                id="advisor-email-error"
                error={invalid ? { message: t('advisor.email.invalid') } : undefined}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="advisor-org" className={labelClass}>
                {t('advisor.email.organisation')}
              </label>
              <input
                id="advisor-org"
                type="text"
                autoComplete="organization"
                placeholder={t('advisor.email.organisationPlaceholder')}
                value={org}
                onChange={(event) => setOrg(event.target.value)}
                className={fieldClass}
              />
            </div>

            {send.isError && (
              <p role="alert" className="font-medium text-[#B42318]">
                {send.error instanceof AdvisorHttpError && send.error.status === 429
                  ? t('advisor.email.rateLimited')
                  : t('advisor.email.failed')}
              </p>
            )}

            <div className="flex flex-wrap justify-between gap-3 pt-1.5">
              <button type="button" onClick={() => changeOpen(false)} className={ghostButton}>
                {t('advisor.email.cancel')}
              </button>
              <button type="submit" disabled={send.isPending} className={primaryButton}>
                {send.isPending ? t('advisor.email.sending') : t('advisor.email.send')}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
