import { useMemo } from 'react'
import { DataTable } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import { formatDate, type HandlingStatus } from '@/features/panel/handling'
import { NeedStatus, needColumns } from './columns'
import { KindTag } from '@/features/panel/tags'
import type { NeedRow } from './labels'

interface NeedsListProps {
  items: NeedRow[]
  caption: string
  onOpen: (id: string) => void
  onSetStatus: (id: string, status: HandlingStatus) => void
}

// Data table from md up; below it, cards, so the list reflows at 320 px without horizontal scroll.
export function NeedsList({ items, caption, onOpen, onSetStatus }: NeedsListProps) {
  const columns = useMemo(() => needColumns({ onOpen, onSetStatus }), [onOpen, onSetStatus])

  return (
    <>
      <div className="hidden md:block">
        <DataTable columns={columns} data={items} caption={caption} emptyMessage="Brak potrzeb dla wybranych filtrów." />
      </div>

      <ul aria-label={caption} className="flex flex-col gap-3 md:hidden">
        {items.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <KindTag kind={row.kind} />
              <NeedStatus need={row} />
            </div>
            <p className="font-medium break-words">{row.query}</p>
            <p className="text-sm break-words text-muted-foreground">
              {formatDate(row.createdAt)} · {row.idea ? `Pomysł: ${row.idea.title}` : (row.contact ?? 'brak kontaktu')}
            </p>
            <Button variant="outline" size="sm" className="self-start" onClick={() => onOpen(row.id)}>
              Szczegóły<span className="sr-only">: {row.query}</span>
            </Button>
          </li>
        ))}
        {items.length === 0 && <li>Brak potrzeb dla wybranych filtrów.</li>}
      </ul>
    </>
  )
}
