import { count } from 'drizzle-orm'
import { db } from './index.js'
import { idea, need, type IdeaAnswer, type ShownResult } from './schema.js'

// Fictional Potrzeby and Pomysły so the Panel administratora has data before the S-03 forms exist.
// No real personal data: contacts use example.com and the 600 000 0xx range.

const queries = [
  'mama sama nie daje rady z opieką nad tatą po udarze',
  'nie mam z kim zostawić dziecka po szkole',
  'samotny sąsiad 80+ nie wychodzi z domu',
  'syn ma problem z hazardem w internecie',
  'jak pomóc nastolatce z depresją',
  'brak transportu do lekarza na wsi',
  'babcia nie radzi sobie z lekami',
  'szukam pracy po 50 a nikt nie odpisuje',
  'dziecko z autyzmem nie ma terapii w okolicy',
  'nie stać mnie na opał na zimę',
  'tata z demencją wychodzi w nocy z domu',
  'jak wrócić do pracy po długiej chorobie',
  'sąsiedzi hałasują a ja opiekuję się chorą żoną',
  'wnuk całe dnie gra i nie chodzi do szkoły',
  'nie umiem załatwić spraw w urzędzie przez internet',
]

const shown: ShownResult[] = [
  { id: 'dla-seniorow__organizator-kompleksowej-opieki-w-miejscu-zamieszkania', title: 'Organizator kompleksowej opieki w miejscu zamieszkania', tier: 'solution' },
  { id: 'dla-zdrowia-i-medycyny__inteligentny-organizer-do-lekow', title: 'Inteligentny organizer do leków', tier: 'related' },
  { id: 'dla-seniorow__bawita', title: 'BaWita', tier: 'related' },
]

// Question texts mirror QUESTIONS in apps/web/src/features/idea/idea-form.ts - the seed has to read
// like the real form, because /testy picks answers out by question text.
const ideas: { title: string; answers: IdeaAnswer[] }[] = [
  {
    title: 'Sąsiedzka zmiana opieki',
    answers: [
      { question: 'Na czym polega Twój pomysł?', answer: 'Sąsiedzi z bloku zapisują się na dyżury po 2 godziny tygodniowo, żeby opiekun osoby starszej miał chwilę wytchnienia.' },
      { question: 'Komu ma pomóc Twój pomysł?', answer: 'Seniorzy' },
      { question: 'Na jakim etapie jest Twój pomysł?', answer: 'Pierwsze próby' },
      // Personal data: the Panel shows it, the public /testy list must not.
      { question: 'Imię', answer: 'Halina' },
    ],
  },
  {
    title: 'Bus do przychodni raz w tygodniu',
    answers: [
      { question: 'Na czym polega Twój pomysł?', answer: 'Gminny bus kursuje we wtorki rano między sołectwami a przychodnią, bo starsi mieszkańcy wsi nie mają jak dojechać do lekarza.' },
      { question: 'Komu ma pomóc Twój pomysł?', answer: 'Seniorzy, Ograniczona mobilność' },
      { question: 'Na jakim etapie jest Twój pomysł?', answer: 'Mam plan' },
    ],
  },
  {
    title: 'Świetlica w szkole do 18:00',
    answers: [
      { question: 'Na czym polega Twój pomysł?', answer: 'Dłuższe godziny świetlicy prowadzone przez wolontariuszy i studentów, dla rodziców pracujących na zmiany.' },
      { question: 'Komu ma pomóc Twój pomysł?', answer: 'Dzieci, młodzież i rodzina' },
      { question: 'Na jakim etapie jest Twój pomysł?', answer: 'To dopiero pomysł' },
    ],
  },
]

const kinds = ['gap', 'gap', 'contact_request', 'idea'] as const
const statuses = ['new', 'new', 'new', 'in_progress', 'done'] as const

const contactFor = (i: number) => (i % 2 === 0 ? `mieszkaniec${i}@example.com` : `600 000 ${String(i).padStart(3, '0')}`)

export async function seedNeeds(total = 60) {
  const [existing] = await db.select({ n: count() }).from(need)
  if ((existing?.n ?? 0) > 0) {
    console.log('Potrzeby already seeded, skipping.')
    return
  }

  const now = Date.now()
  const rows = Array.from({ length: total }, (_, i) => {
    const kind = kinds[i % kinds.length]!
    // Every third non-gap Potrzeba comes from a search that did show Wyniki ("Nic tu nie pasuje?").
    const sawResults = kind !== 'gap' && i % 3 === 0
    const createdAt = new Date(now - i * 47 * 60 * 1000)
    const isContactRequest = kind === 'contact_request'
    return {
      kind,
      status: statuses[i % statuses.length]!,
      query: queries[i % queries.length]!,
      noMatch: !sawResults,
      shownResults: sawResults ? shown : [],
      contact: isContactRequest ? contactFor(i) : null,
      consentAt: isContactRequest ? createdAt : null,
      createdAt,
      updatedAt: createdAt,
    }
  })
  const inserted = await db.insert(need).values(rows).returning({ id: need.id, kind: need.kind, createdAt: need.createdAt })

  // A Pomysł for every Potrzeba of kind 'idea', plus a few proposed without a search.
  const fromNeeds = inserted
    .filter((row) => row.kind === 'idea')
    .map((row, i) => ({ needId: row.id as string | null, createdAt: row.createdAt, i }))
  const standalone = [0, 1, 2].map((i) => ({ needId: null, createdAt: new Date(now - (i * 5 + 2) * 60 * 60 * 1000), i: i + 100 }))
  const ideaRows = [...fromNeeds, ...standalone].map(({ needId, createdAt, i }, row) => ({
    needId,
    status: statuses[i % statuses.length]!,
    ...ideas[i % ideas.length]!,
    contact: contactFor(i + 1),
    consentAt: createdAt,
    // A handful already open for testers, so /testy has something to show on a fresh database.
    openForTesting: row < 4,
    createdAt,
    updatedAt: createdAt,
  }))
  await db.insert(idea).values(ideaRows)
  console.log(`Created ${rows.length} fictional Potrzeby and ${ideaRows.length} Pomysły.`)
}
