import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { IconBell, IconBulb, IconLayoutGrid } from '@tabler/icons-react'
import { trackNoResultOption } from '@/lib/analytics'
import { ContactDialog } from './contact-dialog'
import { useGap } from './use-gap'

type Props = { query: string; onBrowse: () => void }

export function NoResult({ query, onBrowse }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null)
  const gapId = useGap(query)
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  return (
    <section aria-labelledby="no-result-title" className="mx-auto flex w-full max-w-[60rem] flex-col items-center gap-9 px-4 pt-14 pb-20 text-center sm:px-6">
      <h2 id="no-result-title" ref={titleRef} tabIndex={-1} className="text-[1.75rem] leading-9 font-[650] tracking-[-0.03em] outline-none sm:text-[2rem] sm:leading-10">
        Nie mamy jeszcze rozwiązania dla tej sprawy
      </h2>

      <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(20rem,100%),1fr))] gap-4 text-left">
        <Option
          icon={<IconBell />}
          iconClassName="bg-[#EAF1FA] text-[#1A4F8C]"
          title="Powiadom mnie, gdy pojawi się rozwiązanie"
          text="Zostaw e-mail lub numer telefonu. Damy znać, gdy znajdziemy odpowiedź na Twoją sprawę."
        >
          <button
            type="button"
            onClick={() => {
              trackNoResultOption('contact')
              setContactOpen(true)
            }}
            className="mt-auto inline-flex h-14 w-fit items-center rounded-full bg-white px-7 text-base font-semibold text-[#1F2A3A] shadow-[0_0_0_1px_var(--border)] hover:bg-[#F6F8FB] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Zostaw kontakt
          </button>
        </Option>
        <Option
          icon={<IconBulb />}
          iconClassName="bg-[#FFF3D6] text-[#7A4300]"
          title="Zgłoś pomysł na rozwiązanie"
          text="Wiesz, co mogłoby pomóc? Opisz pomysł albo powiedz go głosem - może stać się nową innowacją."
        >
          <Link
            to="/pomysl"
            search={{ q: query, krok: 1 }}
            onClick={() => trackNoResultOption('idea')}
            className="mt-auto inline-flex h-14 w-fit items-center rounded-full bg-primary px-7 text-base font-semibold text-primary-foreground shadow-[0_6px_14px_-6px_rgb(34_99_173/0.55)] hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Zgłoś pomysł
          </Link>
        </Option>
      </div>

      <button
        type="button"
        onClick={() => {
          trackNoResultOption('retry')
          onBrowse()
        }}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-muted px-[1.125rem] text-[0.9375rem] font-semibold text-[#1F2A3A] hover:bg-border focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <IconLayoutGrid aria-hidden="true" className="size-[1.125rem]" />
        Przeglądaj bazę wiedzy
      </button>

      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        query={query}
        gapId={gapId}
        onFinish={() => {
          setContactOpen(false)
          onBrowse()
        }}
      />
    </section>
  )
}

function Option(props: { icon: ReactNode; iconClassName: string; title: string; text: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-3xl border bg-white p-[1.625rem] shadow-[0_1px_2px_0_rgb(15_27_45/0.05),0_10px_24px_-14px_rgb(15_27_45/0.18)]">
      <span aria-hidden="true" className={`flex size-[3.25rem] items-center justify-center rounded-2xl [&_svg]:size-[1.625rem] ${props.iconClassName}`}>
        {props.icon}
      </span>
      <h3 className="mt-1.5 text-[1.3125rem] leading-7 font-[650] tracking-[-0.015em]">{props.title}</h3>
      <p className="mb-2.5 text-base leading-6 text-[#3B4757]">{props.text}</p>
      {props.children}
    </div>
  )
}
