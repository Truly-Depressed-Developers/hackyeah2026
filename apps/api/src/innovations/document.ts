import { z } from 'zod'
import { clean, parseSections } from '../ai/search.js'
import type { RopsMetadata, StoredDocument } from './vector-store.js'

// An Innowacja is stored in the AI service as text sections ("Nazwa: treść", blank-line separated) plus metadata.
// Search and the catalog parse those sections (ai/search.ts, ai/catalog.ts), so the panel writes the exact same shape.

/** Section headings in the order the scraped documents use. */
const SECTIONS = {
  problem: 'Problem',
  solution: 'Rozwiązanie',
  targetGroup: 'Grupa docelowa',
  beneficiaries: 'Odbiorcy i instytucje',
  effectiveness: 'Skuteczność',
  description: 'Opis',
  authors: 'Autorzy',
} as const

const text = z.string().trim().max(10_000)
const link = z.union([z.literal(''), z.url().max(1000)])

export const innovationInput = z.object({
  title: z.string().trim().min(1).max(300),
  categoryId: z.number().int().min(1),
  problem: text,
  solution: text,
  targetGroup: text,
  beneficiaries: text,
  effectiveness: text,
  description: text,
  authors: text,
  sourceUrl: link,
  youtubeVideo: link,
  // Some Innowacje have several PDFs; all of them round-trip.
  detailsPdfs: z.array(z.url().max(1000)).max(10),
  fileZip: link,
})
export type InnovationInput = z.infer<typeof innovationInput>

export interface Category {
  id: number
  name: string
  slug: string
}

/** Categories as the data has them; adding one stays a data change, not a code change. */
export function categoriesOf(docs: StoredDocument[]): Category[] {
  const byId = new Map<number, Category>()
  for (const { metadata: m } of docs) {
    if (typeof m.category_id === 'number' && m.category_name && m.category_slug) {
      byId.set(m.category_id, { id: m.category_id, name: m.category_name, slug: m.category_slug })
    }
  }
  return [...byId.values()].toSorted((a, b) => a.id - b.id)
}

// A blank line ends a section, so paragraphs inside one are joined with single newlines.
const block = (heading: string, value: string) => `${heading}: ${value.replace(/\n\s*\n/g, '\n').trim()}`

export function toStored(input: InnovationInput, category: Category, previous?: RopsMetadata) {
  const document = [
    block('Tytuł innowacji', input.title),
    block('Kategoria', category.name),
    ...Object.entries(SECTIONS).flatMap(([field, heading]) => {
      const value = input[field as keyof typeof SECTIONS]
      return value ? [block(heading, value)] : []
    }),
  ].join('\n\n')

  const metadata: RopsMetadata = {
    // Keep fields the panel doesn't edit (index, scrape timestamp) when updating.
    ...previous,
    title: input.title,
    category_id: category.id,
    category_name: category.name,
    category_slug: category.slug,
    authors: input.authors,
    source_url: input.sourceUrl,
    youtube_video: input.youtubeVideo,
    // The scraper stores PDFs as a JSON-encoded array; keep that shape for the readers.
    details_pdf: input.detailsPdfs.length ? JSON.stringify(input.detailsPdfs) : '',
    file_zip: input.fileZip,
    data_source: previous?.data_source ?? 'panel',
  }
  return { document, metadata }
}

/** Editable fields of a stored Innowacja; the inverse of toStored. */
export function fromStored({ id, document, metadata: m }: StoredDocument) {
  const sections = parseSections(document)
  const section = (heading: string) => sections[heading] ?? ''
  return {
    id,
    title: clean(m.title) ?? section('Tytuł innowacji'),
    categoryId: typeof m.category_id === 'number' ? m.category_id : null,
    categoryName: clean(m.category_name) ?? section('Kategoria'),
    problem: section(SECTIONS.problem),
    solution: section(SECTIONS.solution),
    targetGroup: section(SECTIONS.targetGroup),
    beneficiaries: section(SECTIONS.beneficiaries),
    effectiveness: section(SECTIONS.effectiveness),
    description: section(SECTIONS.description),
    authors: section(SECTIONS.authors) || (clean(m.authors) ?? ''),
    sourceUrl: clean(m.source_url) ?? '',
    youtubeVideo: clean(m.youtube_video) ?? '',
    detailsPdfs: pdfsOf(m.details_pdf),
    fileZip: clean(m.file_zip) ?? '',
    featured: /wybrana do upowszechniania/i.test(section(SECTIONS.description)),
    addedInPanel: m.data_source === 'panel',
  }
}

/** details_pdf arrives as a JSON-encoded array string, a bare URL, or nothing. */
function pdfsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((v) => clean(v) ?? [])
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.flatMap((v) => clean(v) ?? []) : []
  } catch {
    return [value.trim()]
  }
}
