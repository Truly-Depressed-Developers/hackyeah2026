import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, kindLabel, statusBadge, statusLabel, type SubmissionRow } from './labels'

interface SubmissionsListProps {
  items: SubmissionRow[]
  onOpen: (id: string) => void
}

/** Short description of what the Mieszkaniec left: the Pomysł title, or the Zapytanie for the rest. */
const summary = (row: SubmissionRow) => row.idea?.title ?? row.query

// Base design only; the final look comes from the designer. Table from md up, cards below (320 px).
export function SubmissionsList({ items, onOpen }: SubmissionsListProps) {
  return (
    <>
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead>Rodzaj</TableHead>
            <TableHead>Zgłoszenie</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead>Stan</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>
              <span className="sr-only">Akcje</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{kindLabel[row.kind]}</TableCell>
              <TableCell className="min-w-48 whitespace-normal">{summary(row)}</TableCell>
              <TableCell>{row.contact ?? <span className="text-muted-foreground">brak</span>}</TableCell>
              <TableCell>
                <Badge variant={statusBadge[row.status]}>{statusLabel[row.status]}</Badge>
              </TableCell>
              <TableCell>{formatDate(row.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => onOpen(row.id)}>
                  Szczegóły<span className="sr-only">: {summary(row)}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ul className="flex flex-col gap-3 md:hidden">
        {items.map((row) => (
          <li key={row.id} className="flex flex-col gap-2 rounded-xl border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{kindLabel[row.kind]}</span>
              <Badge variant={statusBadge[row.status]}>{statusLabel[row.status]}</Badge>
            </div>
            <p className="break-words">{summary(row)}</p>
            <p className="text-sm text-muted-foreground">
              {formatDate(row.createdAt)} · {row.contact ?? 'brak kontaktu'}
            </p>
            <Button variant="outline" size="sm" className="self-start" onClick={() => onOpen(row.id)}>
              Szczegóły<span className="sr-only">: {summary(row)}</span>
            </Button>
          </li>
        ))}
      </ul>
    </>
  )
}
