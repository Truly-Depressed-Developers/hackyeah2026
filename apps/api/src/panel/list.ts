import { ilike, type AnyColumn } from 'drizzle-orm'
import { z } from 'zod'

// Shared by the Panel administratora lists (Potrzeby, Pomysły): server-side paging and the handling Stan.

export const PAGE_SIZES = [10, 20, 50] as const
export const handlingStatusSchema = z.enum(['new', 'in_progress', 'done'])

export const pageInput = {
  page: z.number().int().min(1).default(1),
  pageSize: z.union(PAGE_SIZES.map((n) => z.literal(n))).default(20),
  status: handlingStatusSchema.optional(),
  q: z.string().trim().max(200).optional(),
}

/** Case-insensitive "contains", with LIKE wildcards in the user's text escaped. */
export const contains = (column: AnyColumn, text: string) => ilike(column, `%${text.replace(/[\\%_]/g, '\\$&')}%`)

export function pageResult<T>(items: T[], total: number, page: number, pageSize: number) {
  return { items, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) }
}

// No tRPC transformer: send Dates as ISO strings so client types match the wire.
export const iso = (date: Date) => date.toISOString()
export const isoOrNull = (date: Date | null) => date?.toISOString() ?? null
