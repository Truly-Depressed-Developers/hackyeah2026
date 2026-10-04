import { useMemo } from 'react'
import { Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { IconDotsVertical, IconFileTypePdf, IconFileZip, IconMovie, IconSparkles, IconUserEdit } from '@tabler/icons-react'
import { CategoryIcon } from '@/components/category-badge'
import { DataTable, type DataTableFeatures } from '@/components/data-table'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tag } from '@/features/panel/tags'
import { categoryFor } from '@/lib/categories'
import type { InnovationRow } from './labels'

const columnHelper = createColumnHelper<DataTableFeatures, InnovationRow>()

const titleLink =
  'rounded-sm font-medium whitespace-normal underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground'

/** Which Akcje a resident gets on this Innowacja, so missing media stand out. */
function Media({ links }: { links: InnovationRow['links'] }) {
  const present = [
    links.video && { label: 'Film', icon: IconMovie },
    links.pdf && { label: 'PDF', icon: IconFileTypePdf },
    links.zip && { label: 'ZIP', icon: IconFileZip },
  ].filter((item) => item !== false)
  return present.length ? (
    <span className="flex flex-wrap gap-1">
      {present.map(({ label, icon }) => (
        <Tag key={label} tone="slate" icon={icon}>
          {label}
        </Tag>
      ))}
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">brak</span>
  )
}

/** Kategoria with the same gradient icon residents see in the catalog. */
function Category({ row }: { row: Pick<InnovationRow, 'categoryName' | 'categorySlug'> }) {
  const category = categoryFor(row.categorySlug ?? undefined)
  return (
    <span className="flex items-center gap-2 whitespace-normal">
      {category && <CategoryIcon category={category} size="sm" />}
      {row.categoryName}
    </span>
  )
}

function Flags({ row }: { row: Pick<InnovationRow, 'featured' | 'addedInPanel'> }) {
  if (!row.featured && !row.addedInPanel) return null
  return (
    <span className="flex flex-wrap gap-1">
      {row.featured && (
        <Tag tone="amber" icon={IconSparkles}>
          Wyróżniona
        </Tag>
      )}
      {row.addedInPanel && (
        <Tag tone="brand" icon={IconUserEdit}>
          Dodana w panelu
        </Tag>
      )}
    </span>
  )
}

function columns(onDelete: (row: InnovationRow) => void) {
  return columnHelper.columns([
    columnHelper.accessor('title', {
      header: 'Innowacja',
      cell: ({ row }) => (
        <span className="flex flex-col gap-1">
          <Link to="/panel/innovations/$innovationId" params={{ innovationId: row.original.id }} className={titleLink}>
            {row.original.title}
          </Link>
          <Flags row={row.original} />
        </span>
      ),
    }),
    columnHelper.accessor('categoryName', { header: 'Kategoria', cell: ({ row }) => <Category row={row.original} /> }),
    columnHelper.display({ id: 'media', header: 'Materiały', cell: ({ row }) => <Media links={row.original.links} /> }),
    columnHelper.display({
      id: 'actions',
      header: () => <span className="sr-only">Akcje</span>,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <IconDotsVertical aria-hidden="true" />
            <span className="sr-only">Akcje: {row.original.title}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<Link to="/panel/innovations/$innovationId" params={{ innovationId: row.original.id }} />}
              >
                Edytuj
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
                Usuń
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    }),
  ])
}

interface InnovationsListProps {
  items: InnovationRow[]
  caption: string
  onDelete: (row: InnovationRow) => void
}

// Data table from md up; below it, cards, so the list reflows at 320 px without horizontal scroll.
export function InnovationsList({ items, caption, onDelete }: InnovationsListProps) {
  const tableColumns = useMemo(() => columns(onDelete), [onDelete])

  return (
    <>
      <div className="hidden md:block">
        <DataTable columns={tableColumns} data={items} caption={caption} emptyMessage="Brak innowacji dla wybranych filtrów." />
      </div>

      <ul aria-label={caption} className="flex flex-col gap-3 md:hidden">
        {items.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 rounded-2xl border bg-card p-4 shadow-xs">
            <p className="font-medium break-words">{row.title}</p>
            <Flags row={row} />
            <span className="text-sm text-muted-foreground">
              <Category row={row} />
            </span>
            <Media links={row.links} />
            <div className="flex flex-wrap gap-2">
              <Link
                to="/panel/innovations/$innovationId"
                params={{ innovationId: row.id }}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                Edytuj<span className="sr-only">: {row.title}</span>
              </Link>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDelete(row)}>
                Usuń<span className="sr-only">: {row.title}</span>
              </Button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li>Brak innowacji dla wybranych filtrów.</li>}
      </ul>
    </>
  )
}
