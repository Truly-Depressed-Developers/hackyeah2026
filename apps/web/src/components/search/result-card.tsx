import { useId, useState, type ReactNode } from 'react'
import { IconArrowRight, IconChevronDown, IconExternalLink, IconFileText, IconPhone, IconSparkles } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { Button, buttonVariants } from '@/components/ui/button'
import { CategoryBadge } from '@/components/category-badge'
import type { Result, ResultKind } from '@/lib/ai/client'
import { trackAction, trackExpanded } from '@/lib/analytics'
import { categoryFor } from '@/lib/categories'
import { VideoDialog, youtubeId } from './video-dialog'

const KIND_LABEL: Record<ResultKind, string> = {
  innovation: 'Sprawdzone rozwiązanie',
  helper: 'Kto może pomóc',
  fact: 'Fakt',
}

const DETAIL_LABELS = [
  ['problem', 'Na jaki problem odpowiada'],
  ['targetGroup', 'Dla kogo'],
  ['effectiveness', 'Czy to działa'],
] as const

export function ResultCard({ result }: { result: Result }) {
  const [expanded, setExpanded] = useState(false)
  const category = categoryFor(result.categorySlug)
  const detailsId = useId()

  const details = DETAIL_LABELS.flatMap(([key, label]) => {
    const text = result.details?.[key]
    return text ? [{ label, text }] : []
  })
  const phone = result.links?.phone
  const videoId = result.links?.video ? youtubeId(result.links.video) : null
  const opensPage = result.kind === 'innovation'
  const primary = phone ? 'phone' : opensPage ? 'page' : videoId ? 'video' : details.length > 0 ? 'details' : null

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="rounded-md bg-muted px-2 py-1 font-medium">{KIND_LABEL[result.kind]}</span>
        {category ? <CategoryBadge category={category} /> : result.category && <span className="text-muted-foreground">{result.category}</span>}
      </p>
      <h3 className="text-lg font-semibold leading-snug">{result.title}</h3>
      <p>{result.summary}</p>

      <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
        <p className="text-sm font-semibold">Dlaczego to pasuje</p>
        <p>{result.why}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {result.whyGenerated && <IconSparkles aria-hidden="true" className="size-4" />}
          {result.whyGenerated ? 'Wygenerowane przez AI na podstawie' : 'Na podstawie'}: {result.source.label}
        </p>
      </div>

      {!opensPage && details.length > 0 && (
        <dl id={detailsId} hidden={!expanded} className="flex flex-col gap-3">
          {details.map(({ label, text }) => (
            <div key={label}>
              <dt className="font-semibold">{label}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {phone && (
          <a href={`tel:${phone.replace(/\s/g, '')}`} onClick={() => trackAction(result.id, 'phone')} className={cn(buttonVariants(), 'h-11 px-4 text-base')}>
            <IconPhone aria-hidden="true" />
            Zadzwoń: {phone}
          </a>
        )}
        {opensPage && (
          <Link
            to="/innowacja/$id"
            params={{ id: result.id }}
            onClick={() => trackAction(result.id, 'innovation_page')}
            className={cn(buttonVariants(), 'h-11 px-4 text-base')}
          >
            Zobacz innowację
            <IconArrowRight aria-hidden="true" />
          </Link>
        )}
        {videoId && <VideoDialog videoId={videoId} title={result.title} primary={primary === 'video'} onOpen={() => trackAction(result.id, 'video')} />}
        {!opensPage && details.length > 0 && (
          <Button
            variant={primary === 'details' ? 'default' : 'outline'}
            className="h-11 px-4 text-base"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => {
              if (!expanded) trackExpanded(result.id)
              setExpanded((open) => !open)
            }}
          >
            <IconChevronDown aria-hidden="true" className={cn('transition-transform', expanded && 'rotate-180')} />
            {expanded ? 'Zwiń szczegóły' : 'Szczegóły'}
          </Button>
        )}
        {!opensPage && result.source.url && (
          <ExternalLinkButton href={result.source.url} onClick={() => trackAction(result.id, 'source')}>
            Zobacz w: {result.source.label}
          </ExternalLinkButton>
        )}
        {!opensPage && result.links?.pdf && (
          <ExternalLinkButton href={result.links.pdf} icon={<IconFileText aria-hidden="true" />} onClick={() => trackAction(result.id, 'pdf')}>
            Opis (PDF)
          </ExternalLinkButton>
        )}
      </div>
    </li>
  )
}

function ExternalLinkButton({ href, icon, children, onClick }: { href: string; icon?: ReactNode; children: ReactNode; onClick?: () => void }) {
  return (
    <a
      href={href}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: 'outline' }), 'h-auto min-h-11 max-w-full shrink px-4 py-2 text-base whitespace-normal')}
    >
      {icon}
      {children}
      <IconExternalLink aria-hidden="true" />
      <span className="sr-only">(otwiera się w nowej karcie)</span>
    </a>
  )
}
