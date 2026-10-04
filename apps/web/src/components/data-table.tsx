import { columnVisibilityFeature, tableFeatures, useTable, type ColumnDef, type RowData } from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// shadcn data-table pattern on TanStack Table v9. Paging, sorting and filtering happen on the server,
// so the table only needs the core features (plus visibility for getVisibleCells) to render the current page.
export const dataTableFeatures = tableFeatures({ columnVisibilityFeature })
export type DataTableFeatures = typeof dataTableFeatures

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  /** Caption for screen readers, e.g. which list and page this is. */
  caption: string
  emptyMessage: string
}

export function DataTable<TData extends RowData>({ columns, data, caption, emptyMessage }: DataTableProps<TData>) {
  const table = useTable({ features: dataTableFeatures, data, columns })

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="bg-muted/60">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="h-11 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{header.isPlaceholder ? null : <table.FlexRender header={header} />}</TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="transition-colors hover:bg-primary-soft/50">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3.5 text-[0.9375rem] leading-6">
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
