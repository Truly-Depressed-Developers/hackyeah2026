import { useMemo } from 'react'
import { DataTable } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { submissionColumns } from './columns'
import { formatDate, kindLabel, statusBadge, statusLabel, summary, type SubmissionRow, type SubmissionStatus } from './labels'

interface SubmissionsListProps {
  items: SubmissionRow[]
  caption: string
  onOpen: (id: string) => void
  onSetStatus: (id: string, status: SubmissionStatus) => void
}

// Data table from md up; below it, cards, so the list reflows at 320 px without horizontal scroll.
export function SubmissionsList({ items, caption, onOpen, onSetStatus }: SubmissionsListProps) {
  const columns = useMemo(() => submissionColumns({ onOpen, onSetStatus }), [onOpen, onSetStatus])

  return (
    <>
      <div className="hidden md:block">
        <DataTable columns={columns} data={items} caption={caption} emptyMessage="Brak zgłoszeń dla wybranych filtrów." />
      </div>

      <ul aria-label={caption} className="flex flex-col gap-3 md:hidden">
        {items.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{kindLabel[row.kind]}</Badge>
              <Badge variant={statusBadge[row.status]}>{statusLabel[row.status]}</Badge>
            </div>
            <p className="font-medium break-words">{summary(row)}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(row.createdAt)} · {row.contact ?? 'brak kontaktu'}
            </p>
            <Button variant="outline" size="sm" className="self-start" onClick={() => onOpen(row.id)}>
              Szczegóły<span className="sr-only">: {summary(row)}</span>
            </Button>
          </li>
        ))}
        {items.length === 0 && <li>Brak zgłoszeń dla wybranych filtrów.</li>}
      </ul>
    </>
  )
}
