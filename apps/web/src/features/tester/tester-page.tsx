import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { IconArrowLeft, IconCircleCheck } from '@tabler/icons-react'
import { ghostButton, primaryButton } from '@/components/resident/controls'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/lib/i18n'
import { trpc } from '@/lib/trpc'
import { TesterList, TesterSteps } from './tester-list'
import { TesterSignup } from './tester-signup'

interface Sent {
  name: string
  contact: string
  alreadySignedUp: boolean
}

/**
 * One screen, three states, driven by the URL: the list, the sign-up form for `?pomysl=<id>`, and the
 * confirmation at `?pomysl=<id>&krok=2`. A deep link into the confirmation without a sent form falls
 * back to the form, the same way the Pomysł wizard guards its thank-you step.
 */
export function TesterPage({ ideaId, step }: { ideaId: string | undefined; step: number | undefined }) {
  const t = useT()
  const navigate = useNavigate({ from: '/testy' })
  const [sent, setSent] = useState<Sent | undefined>()
  const ideas = useQuery(trpc.ideas.openForTesting.queryOptions())

  const selected = ideaId ? ideas.data?.find((idea) => idea.id === ideaId) : undefined
  const done = step === 2 && sent && selected
  // Keyed off what actually renders, not off the URL: a `?pomysl=` for a Pomysł ROPS has since closed
  // falls back to the list, and the hero has to follow it.
  const showingList = ideas.isSuccess && !selected

  const backToList = () => {
    setSent(undefined)
    navigate({ search: {}, replace: true })
  }

  return (
    <>
      <section aria-labelledby="tester-title" className="overflow-hidden border-b bg-hero-gradient">
        <div className="mx-auto flex w-full max-w-[73.75rem] flex-col gap-6 px-4 pt-8 pb-10 sm:px-6">
          <div>
            {showingList ? (
              <Link to="/" search={{}} className={backButton}>
                <IconArrowLeft aria-hidden="true" className="size-5" />
                {t('tester.backToSearch')}
              </Link>
            ) : (
              <button type="button" onClick={backToList} className={backButton}>
                <IconArrowLeft aria-hidden="true" className="size-5" />
                {t('tester.allIdeas')}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            <h1 id="tester-title" className="text-[2.25rem] leading-[2.75rem] font-[650] tracking-[-0.03em]">
              {t('dock.tester')}
            </h1>
            <p className="max-w-[45rem] text-lg leading-7 text-[#3B4757]">
              {t('tester.lead')}
            </p>
          </div>

          {showingList && <TesterSteps />}
        </div>
      </section>

      <div className="flex flex-1 flex-col">
        {ideas.isPending && (
          <div className="mx-auto w-full max-w-[73.75rem] px-4 pt-11 pb-16 sm:px-6">
            <p role="status" className="sr-only">
              {t('tester.loading')}
            </p>
            <Skeleton className="h-96 w-full rounded-[1.25rem]" />
          </div>
        )}

        {ideas.isError && (
          <div className="mx-auto w-full max-w-[73.75rem] px-4 pt-11 pb-16 sm:px-6">
            <div role="alert" className="flex flex-col items-start gap-3 rounded-[1.25rem] border border-destructive p-6">
              <p className="font-semibold text-destructive">{t('tester.loadError')}</p>
              <button type="button" onClick={() => ideas.refetch()} className={ghostButton}>
                {t('common.retry')}
              </button>
            </div>
          </div>
        )}

        {ideas.isSuccess && (
          <>
            {done && <Done sent={sent} title={selected.title} onAgain={backToList} />}

            {!done && selected && (
              <TesterSignup
                idea={selected}
                onBack={backToList}
                onSignedUp={(result) => {
                  setSent(result)
                  navigate({ search: { pomysl: selected.id, krok: 2 }, replace: true })
                }}
              />
            )}

            {!done && !selected && <TesterList ideas={ideas.data} />}
          </>
        )}
      </div>
    </>
  )
}

function Done({ sent, title, onAgain }: { sent: Sent; title: string; onAgain: () => void }) {
  const t = useT()
  return (
    <div
      role="status"
      className="mx-auto flex w-full max-w-[45rem] flex-col items-center gap-4 px-4 pt-11 pb-16 text-center sm:px-6"
    >
      <span aria-hidden="true" className="flex size-[5.25rem] items-center justify-center rounded-full bg-[#E2F4EC] text-[#0F6B4F]">
        <IconCircleCheck className="size-[2.625rem]" stroke={2} />
      </span>
      <h2 className="text-[1.75rem] leading-9 font-[650] tracking-[-0.02em]">
        {sent.alreadySignedUp ? t('tester.done.already', { name: sent.name }) : t('tester.done.thanks', { name: sent.name })}
      </h2>
      <p className="text-lg leading-7 text-muted-foreground">
        {sent.alreadySignedUp ? t('tester.done.alreadyText') : t('tester.done.text')}{' '}
        <span className="text-foreground">„{title}”</span>. {t('tester.done.contact')}{' '}
        <strong className="font-semibold text-foreground">{sent.contact}</strong>
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onAgain} className={ghostButton}>
          {t('tester.done.others')}
        </button>
        <Link to="/" search={{}} className={primaryButton}>
          {t('idea.backHome')}
        </Link>
      </div>
    </div>
  )
}

// min-h rather than h, and wrapping text: at 200% the label has to be allowed to break onto two lines.
const backButton =
  'inline-flex max-w-full min-h-11 w-fit items-center gap-2 rounded-full bg-white py-2 pr-[1.125rem] pl-3.5 text-left text-[0.9375rem] font-semibold text-wrap text-foreground shadow-[0_0_0_1px_var(--border)] hover:bg-[#F6F8FB] focus-visible:outline-3 focus-visible:outline-offset-[3px] focus-visible:outline-ring'
