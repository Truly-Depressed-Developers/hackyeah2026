import { z } from 'zod'
import { isEmail, isPhone } from '@/lib/contact'
import { firstCategoryIn } from '@/lib/categories'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from 'api/router'

export type TestableIdea = inferRouterOutputs<AppRouter>['ideas']['openForTesting'][number]

// The public list only carries the answers ROPS cleared for it; the author's „Imię" never arrives here.
const QUESTIONS = {
  essence: 'Na czym polega Twój pomysł?',
  groups: 'Komu ma pomóc Twój pomysł?',
  stage: 'Na jakim etapie jest Twój pomysł?',
} as const

const answerTo = (idea: TestableIdea, question: string) => idea.answers.find((item) => item.question === question)?.answer

export const essenceOf = (idea: TestableIdea) => answerTo(idea, QUESTIONS.essence)
export const stageOf = (idea: TestableIdea) => answerTo(idea, QUESTIONS.stage)
export const groupsOf = (idea: TestableIdea) => answerTo(idea, QUESTIONS.groups)

/** The chip comes from the first Kategoria the Mieszkaniec picked; "Inna grupa" simply has none. */
export const categoryOf = (idea: TestableIdea) => firstCategoryIn(groupsOf(idea))

export const testerSchema = z.object({
  name: z.string().trim().min(1, 'tester.error.name').max(100),
  contact: z
    .string()
    .trim()
    .refine(
      (value) => isEmail(value) || isPhone(value),
      'tester.error.contact',
    ),
  consent: z.boolean().refine(Boolean, 'tester.error.consent'),
})

export type TesterValues = z.infer<typeof testerSchema>
