import { useId, useState, type ReactNode } from 'react'
import { ChevronDown, ExternalLink, FileText, Phone, Sparkles } from 'lucide-react'
import { cn } from 'cn'
import { Button, buttonVariants } from '@/components/ui/button'
import type { Result, ResultKind } from '@/lib/ai/client'
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
  const detailsId = useId()

  const details = DETAIL_LABELS.flatMap(([key, label]) => {
    const text = result.details?.[key]
    return text ? [{ label, text }] : []
  })
  const phone = result.links?.phone
  const videoId = result.links?.video ? youtubeId(result.links.video) : null
  const primary = phone ? 'phone' : videoId ? 'video' : details.length > 0 ? 'details' : null

  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="rounded-md bg-muted px-2 py-1 font-medium">{KIND_LABEL[result.kind]}</span>
        {result.category && <span className="text-muted-foreground">{result.category}</span>}
      </p>
      <h3 className="text-lg font-semibold leading-snug">{result.title}</h3>
      <p>{result.summary}</p>

      <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3">
        <p className="text-sm font-semibold">Dlaczego to pasuje</p>
        <p>{result.why}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Sparkles aria-hidden="true" className="size-4" />
          Wygenerowane przez AI na podstawie: {result.source.label}
        </p>
      </div>

      {details.length > 0 && (
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
          <a href={`tel:${phone.replace(/\s/g, '')}`} className={cn(buttonVariants(), 'h-11 px-4 text-base')}>
            <Phone aria-hidden="true" />
            Zadzwoń: {phone}
          </a>
        )}
        {videoId && <VideoDialog videoId={videoId} title={result.title} primary={primary === 'video'} />}
        {details.length > 0 && (
          <Button
            variant={primary === 'details' ? 'default' : 'outline'}
            className="h-11 px-4 text-base"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => setExpanded((open) => !open)}
          >
            <ChevronDown aria-hidden="true" className={cn('transition-transform', expanded && 'rotate-180')} />
            {expanded ? 'Zwiń szczegóły' : 'Szczegóły'}
          </Button>
        )}
      </div>

      {(result.source.url || result.links?.pdf) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {result.source.url && <ExternalLinkText href={result.source.url}>Zobacz w: {result.source.label}</ExternalLinkText>}
          {result.links?.pdf && (
            <ExternalLinkText href={result.links.pdf} icon={<FileText aria-hidden="true" className="size-4" />}>
              Opis (PDF)
            </ExternalLinkText>
          )}
        </div>
      )}
    </li>
  )
}

function ExternalLinkText({ href, icon, children }: { href: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-1.5 underline underline-offset-2 hover:text-muted-foreground"
    >
      {icon}
      {children}
      <ExternalLink aria-hidden="true" className="size-4" />
      <span className="sr-only">(otwiera się w nowej karcie)</span>
    </a>
  )
}
