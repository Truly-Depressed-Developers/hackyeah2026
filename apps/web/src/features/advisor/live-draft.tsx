import { useLayoutEffect, useRef } from 'react'
import { IconSparkles } from '@tabler/icons-react'
import { cn } from 'cn'
import { useT } from '@/lib/i18n'
import { AdvisorReport } from './advisor-report'
import { aiBadge, panel, panelTitle } from './advisor-ui'
import { useSmoothText } from './use-smooth-text'

// Within this many px of the bottom counts as "following along".
const STICK_THRESHOLD = 48

/** The draft as the AI writes it during step 5, so the longest step isn't a spinner. */
export function LiveDraft({ markdown, writing }: { markdown: string; writing: boolean }) {
  const t = useT()
  const { text, done } = useSmoothText(markdown)
  const boxRef = useRef<HTMLDivElement>(null)
  const following = useRef(true)

  // Every render: each one is new text, and following the bottom has to keep up with it.
  useLayoutEffect(() => {
    const box = boxRef.current
    if (box && following.current) box.scrollTop = box.scrollHeight
  })

  const typing = writing || !done

  return (
    <section aria-labelledby="advisor-live-title" className={cn(panel, 'mx-auto w-full max-w-[73.75rem]')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="advisor-live-title" className={panelTitle}>
          {t('advisor.draft.title')}
        </h2>
        <span className={aiBadge}>
          <IconSparkles aria-hidden="true" />
          {typing ? t('advisor.draft.writing') : t('advisor.draft.done')}
        </span>
      </div>
      {/* No aria-live: a screen reader would read every chunk. The step list carries the status. */}
      <div
        ref={boxRef}
        tabIndex={0}
        role="region"
        aria-label={t('advisor.draft.liveLabel')}
        aria-busy={typing}
        onScroll={(event) => {
          const box = event.currentTarget
          following.current = box.scrollHeight - box.scrollTop - box.clientHeight < STICK_THRESHOLD
        }}
        className="max-h-[28rem] overflow-y-auto pr-2 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
      >
        {text ? (
          <AdvisorReport markdown={text} streaming={typing} />
        ) : (
          <p className="text-muted-foreground">{t('advisor.draft.waiting')}</p>
        )}
        {typing && <span aria-hidden="true" className="mt-1 inline-block h-5 w-2 animate-pulse rounded-sm bg-primary/60 motion-reduce:animate-none" />}
      </div>
    </section>
  )
}
