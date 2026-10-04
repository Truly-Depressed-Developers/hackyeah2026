import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { IconDotsVertical } from '@tabler/icons-react'
import type { DataTableFeatures } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDate, statusLabel, type HandlingStatus } from '@/features/panel/handling'
import { KindTag, StatusTag } from '@/features/panel/tags'
import type { NeedRow } from './labels'

const columnHelper = createColumnHelper<DataTableFeatures, NeedRow>()

interface ColumnActions {
  onOpen: (id: string) => void
  onSetStatus: (id: string, status: HandlingStatus) => void
}

/** Stan of a Potrzeba; one that led to a Pomysł is handled there, so it shows the Pomysł's Stan. */
export function NeedStatus({ need }: { need: Pick<NeedRow, 'status' | 'idea'> }) {
  return <StatusTag status={need.idea?.status ?? need.status} prefix={need.idea ? 'Pomysł: ' : undefined} />
}

export function needColumns({ onOpen, onSetStatus }: ColumnActions) {
  return columnHelper.columns([
    columnHelper.accessor('kind', {
      header: 'Rodzaj',
      cell: ({ row }) => <KindTag kind={row.original.kind} />,
    }),
    columnHelper.accessor('query', {
      header: 'Zapytanie mieszkańca',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onOpen(row.original.id)}
          className="max-w-md rounded-sm text-left font-medium whitespace-normal underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {row.original.query}
        </button>
      ),
    }),
    columnHelper.display({
      id: 'outcome',
      header: 'Kontakt / Pomysł',
      cell: ({ row }) =>
        row.original.idea ? (
          <Link
            to="/panel/ideas/$ideaId"
            params={{ ideaId: row.original.idea.id }}
            className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {row.original.idea.title}
          </Link>
        ) : (
          (row.original.contact ?? <span className="text-muted-foreground">brak</span>)
        ),
    }),
    columnHelper.accessor('status', {
      header: 'Stan',
      cell: ({ row }) => <NeedStatus need={row.original} />,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Data',
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Akcje</span>,
      cell: ({ row }) => {
        const { id, idea, status, query } = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <IconDotsVertical aria-hidden="true" />
              <span className="sr-only">Akcje: {query}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onOpen(id)}>Pokaż szczegóły</DropdownMenuItem>
                {idea && (
                  <DropdownMenuItem render={<Link to="/panel/ideas/$ideaId" params={{ ideaId: idea.id }} />}>
                    Przejdź do pomysłu
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              {!idea && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Zmień stan</DropdownMenuLabel>
                    {(Object.keys(statusLabel) as HandlingStatus[])
                      .filter((next) => next !== status)
                      .map((next) => (
                        <DropdownMenuItem key={next} onClick={() => onSetStatus(id, next)}>
                          {statusLabel[next]}
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }),
  ])
}
