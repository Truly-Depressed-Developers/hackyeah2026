import type { MouseEvent } from 'react'
import { Field, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export const PAGE_SIZES = [10, 20, 50] as const
export type PageSize = (typeof PAGE_SIZES)[number]

interface SubmissionsPaginationProps {
  page: number
  pageCount: number
  pageSize: PageSize
  total: number
  /** Real URL for each page, so links work with middle-click and without JS routing. */
  hrefFor: (page: number) => string
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSize) => void
}

/** Page numbers to show: first, last, and a window around the current page; null marks a gap. */
function pageWindow(page: number, pageCount: number): (number | null)[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount))
  const sorted = [...pages].toSorted((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1]! > 1 ? [null, p] : [p]))
}

export function SubmissionsPagination(props: SubmissionsPaginationProps) {
  const { page, pageCount, pageSize, total } = props
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const go = (target: number) => (event: MouseEvent) => {
    event.preventDefault()
    if (target >= 1 && target <= pageCount && target !== page) props.onPageChange(target)
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <p className="text-sm text-muted-foreground">
          {from}–{to} z {total}
        </p>
        <Field orientation="horizontal" className="w-auto">
          <FieldLabel htmlFor="page-size" className="whitespace-nowrap">
            Na stronie
          </FieldLabel>
          <NativeSelect
            id="page-size"
            size="sm"
            value={pageSize}
            onChange={(e) => props.onPageSizeChange(Number(e.target.value) as PageSize)}
          >
            {PAGE_SIZES.map((size) => (
              <NativeSelectOption key={size} value={size}>
                {size}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>

      {pageCount > 1 && (
        <Pagination aria-label="Strony listy zgłoszeń" className="mx-0 w-auto justify-start sm:justify-end">
          <PaginationContent className="flex-wrap">
            <PaginationItem>
              <PaginationPrevious
                href={props.hrefFor(Math.max(1, page - 1))}
                onClick={go(page - 1)}
                aria-disabled={page <= 1}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
              />
            </PaginationItem>
            {pageWindow(page, pageCount).map((p, i) =>
              p === null ? (
                <PaginationItem key={`gap-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink href={props.hrefFor(p)} onClick={go(p)} isActive={p === page} aria-label={`Strona ${p}`}>
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href={props.hrefFor(Math.min(pageCount, page + 1))}
                onClick={go(page + 1)}
                aria-disabled={page >= pageCount}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
