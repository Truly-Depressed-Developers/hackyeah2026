import { createColumnHelper } from '@tanstack/react-table'
import { IconDotsVertical } from '@tabler/icons-react'
import type { DataTableFeatures } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
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
import { formatDate, kindLabel, statusBadge, statusLabel, summary, type SubmissionRow, type SubmissionStatus } from './labels'

const columnHelper = createColumnHelper<DataTableFeatures, SubmissionRow>()

interface ColumnActions {
  onOpen: (id: string) => void
  onSetStatus: (id: string, status: SubmissionStatus) => void
}

export function submissionColumns({ onOpen, onSetStatus }: ColumnActions) {
  return columnHelper.columns([
    columnHelper.accessor('kind', {
      header: 'Rodzaj',
      cell: ({ row }) => <Badge variant="outline">{kindLabel[row.original.kind]}</Badge>,
    }),
    columnHelper.display({
      id: 'summary',
      header: 'Zgłoszenie',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onOpen(row.original.id)}
          className="max-w-md rounded-sm text-left font-medium whitespace-normal underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {summary(row.original)}
        </button>
      ),
    }),
    columnHelper.accessor('contact', {
      header: 'Kontakt',
      cell: ({ row }) => row.original.contact ?? <span className="text-muted-foreground">brak</span>,
    }),
    columnHelper.accessor('status', {
      header: 'Stan',
      cell: ({ row }) => <Badge variant={statusBadge[row.original.status]}>{statusLabel[row.original.status]}</Badge>,
    }),
    columnHelper.accessor('createdAt', {
      header: 'Data',
      cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Akcje</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <IconDotsVertical aria-hidden="true" />
            <span className="sr-only">Akcje: {summary(row.original)}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => onOpen(row.original.id)}>Pokaż szczegóły</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Zmień stan</DropdownMenuLabel>
              {(Object.keys(statusLabel) as SubmissionStatus[])
                .filter((status) => status !== row.original.status)
                .map((status) => (
                  <DropdownMenuItem key={status} onClick={() => onSetStatus(row.original.id, status)}>
                    {statusLabel[status]}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ])
}
