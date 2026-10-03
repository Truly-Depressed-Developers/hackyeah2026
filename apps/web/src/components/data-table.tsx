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
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>{header.isPlaceholder ? null : <table.FlexRender header={header} />}</TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
