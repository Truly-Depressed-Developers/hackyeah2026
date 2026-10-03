import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { invalidateCatalog } from '../ai/catalog.js'
import { pageInput, pageResult } from '../panel/list.js'
import { panelProcedure, router } from '../trpc.js'
import { categoriesOf, fromStored, innovationInput, toStored, type InnovationInput } from './document.js'
import { addDocument, deleteDocument, getDocument, listDocuments, updateDocument } from './vector-store.js'

// Innowacje live in the AI service, not in Postgres: this router is a guarded, typed window onto its document API.

const idInput = z.object({ id: z.string().min(1).max(500) })

async function categoryFor(input: InnovationInput) {
  const category = categoriesOf(await listDocuments()).find((c) => c.id === input.categoryId)
  if (!category) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nieznana kategoria.' })
  return category
}

// Matches what the Pracownik types, with or without Polish diacritics.
const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export const panelInnovationsRouter = router({
  categories: panelProcedure.query(async () => categoriesOf(await listDocuments())),

  // The service has no search or filters, so the panel filters and pages the whole (small) collection here.
  list: panelProcedure
    .input(z.object({ page: pageInput.page, pageSize: pageInput.pageSize, q: pageInput.q, categoryId: z.number().int().optional() }))
    .query(async ({ input }) => {
      const q = input.q && normalize(input.q)
      const items = (await listDocuments())
        .map(fromStored)
        .filter((item) => (input.categoryId ? item.categoryId === input.categoryId : true))
        .filter((item) => (q ? normalize(item.title).includes(q) : true))
        .toSorted((a, b) => a.title.localeCompare(b.title, 'pl'))
      const start = (input.page - 1) * input.pageSize
      const page = items.slice(start, start + input.pageSize).map(({ id, title, categoryName, featured, addedInPanel, youtubeVideo, detailsPdf, fileZip }) => ({
        id,
        title,
        categoryName,
        featured,
        addedInPanel,
        links: { video: Boolean(youtubeVideo), pdf: Boolean(detailsPdf), zip: Boolean(fileZip) },
      }))
      return pageResult(page, items.length, input.page, input.pageSize)
    }),

  get: panelProcedure.input(idInput).query(async ({ input }) => {
    const stored = await getDocument(input.id)
    if (!stored) throw new TRPCError({ code: 'NOT_FOUND' })
    return fromStored(stored)
  }),

  create: panelProcedure.input(innovationInput).mutation(async ({ input }) => {
    const { document, metadata } = toStored(input, await categoryFor(input))
    const id = await addDocument(document, { ...metadata, scrape_timestamp: new Date().toISOString().slice(0, 10) })
    invalidateCatalog()
    return { id }
  }),

  update: panelProcedure.input(idInput.extend({ data: innovationInput })).mutation(async ({ input }) => {
    const previous = await getDocument(input.id)
    if (!previous) throw new TRPCError({ code: 'NOT_FOUND' })
    const { document, metadata } = toStored(input.data, await categoryFor(input.data), previous.metadata)
    await updateDocument(input.id, document, metadata)
    invalidateCatalog()
    return { id: input.id }
  }),

  delete: panelProcedure.input(idInput).mutation(async ({ input }) => {
    await deleteDocument(input.id)
    invalidateCatalog()
    return { id: input.id }
  }),
})

