import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { DataTable, type DataTableFeatures } from '@/components/data-table'
import { buttonVariants } from '@/components/ui/button'
import { formatDate } from '@/features/panel/handling'
import { StatusTag } from '@/features/panel/tags'
import { testerCountLabel } from '@/lib/plural'
import type { IdeaRow } from './labels'

const columnHelper = createColumnHelper<DataTableFeatures, IdeaRow>()

const titleLink =
  'rounded-sm font-medium whitespace-normal underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

const columns = columnHelper.columns([
  columnHelper.accessor('title', {
    header: 'Pomysł',
    cell: ({ row }) => (
      <Link to="/panel/ideas/$ideaId" params={{ ideaId: row.original.id }} className={titleLink}>
        {row.original.title}
      </Link>
    ),
  }),
  columnHelper.display({
    id: 'source',
    header: 'Z zapytania',
    cell: ({ row }) =>
      row.original.need ? (
        <span className="line-clamp-2 max-w-xs whitespace-normal">{row.original.need.query}</span>
      ) : (
        <span className="text-muted-foreground">bez wyszukiwania</span>
      ),
  }),
  columnHelper.accessor('contact', { header: 'Kontakt' }),
  columnHelper.display({
    id: 'testers',
    header: 'Testy',
    cell: ({ row }) =>
      row.original.openForTesting ? (
        <span className="whitespace-nowrap">{testerCountLabel(row.original.testerCount)}</span>
      ) : (
        <span className="text-muted-foreground">zamknięty</span>
      ),
  }),
  columnHelper.accessor('status', {
    header: 'Stan',
    cell: ({ row }) => <StatusTag status={row.original.status} />,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Data',
    cell: ({ row }) => <span className="whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
  }),
])

// Data table from md up; below it, cards, so the list reflows at 320 px without horizontal scroll.
export function IdeasList({ items, caption }: { items: IdeaRow[]; caption: string }) {
  return (
    <>
      <div className="hidden md:block">
        <DataTable columns={columns} data={items} caption={caption} emptyMessage="Brak pomysłów dla wybranych filtrów." />
      </div>

      <ul aria-label={caption} className="flex flex-col gap-3 md:hidden">
        {items.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-xs">
            <StatusTag status={row.status} />
            <p className="font-medium break-words">{row.title}</p>
            <p className="text-sm break-words text-muted-foreground">
              {formatDate(row.createdAt)} · {row.contact}
              {row.openForTesting && ` · ${testerCountLabel(row.testerCount)}`}
            </p>
            <Link
              to="/panel/ideas/$ideaId"
              params={{ ideaId: row.id }}
              className={buttonVariants({ variant: 'outline', size: 'sm', className: 'self-start' })}
            >
              Otwórz<span className="sr-only">: {row.title}</span>
            </Link>
          </li>
        ))}
        {items.length === 0 && <li>Brak pomysłów dla wybranych filtrów.</li>}
      </ul>
    </>
  )
}
