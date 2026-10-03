import { useState, type FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import type { InnovationCategory, InnovationInput } from './labels'

export const emptyInnovation: InnovationInput = {
  title: '',
  categoryId: 0,
  problem: '',
  solution: '',
  targetGroup: '',
  beneficiaries: '',
  effectiveness: '',
  description: '',
  authors: '',
  sourceUrl: '',
  youtubeVideo: '',
  detailsPdf: '',
  fileZip: '',
}

type TextField = Exclude<keyof InnovationInput, 'categoryId'>

// The sections residents see on the Innowacja page, in the same order.
const sections: { field: TextField; label: string; hint: string }[] = [
  { field: 'problem', label: 'Problem', hint: 'Na jaki problem odpowiada innowacja.' },
  { field: 'solution', label: 'Rozwiązanie', hint: 'Krótko: na czym polega. Wyszukiwarka pokazuje to jako opis wyniku.' },
  { field: 'targetGroup', label: 'Grupa docelowa', hint: 'Komu pomaga.' },
  { field: 'beneficiaries', label: 'Odbiorcy i instytucje', hint: 'Kto może ją wdrożyć, np. ośrodki pomocy, gminy.' },
  { field: 'effectiveness', label: 'Skuteczność', hint: 'Wyniki testu lub wdrożeń.' },
  { field: 'description', label: 'Opis', hint: 'Pełny opis innowacji.' },
  { field: 'authors', label: 'Autorzy', hint: 'Widoczni tylko w panelu, chyba że serwis ma włączone pokazywanie autorów.' },
]

const links: { field: TextField; label: string }[] = [
  { field: 'sourceUrl', label: 'Strona źródłowa' },
  { field: 'youtubeVideo', label: 'Film na YouTube' },
  { field: 'detailsPdf', label: 'Dokument PDF' },
  { field: 'fileZip', label: 'Paczka ZIP do pobrania' },
]

interface InnovationFormProps {
  initial: InnovationInput
  categories: InnovationCategory[]
  submitLabel: string
  isPending: boolean
  error?: string
  onSubmit: (data: InnovationInput) => void
}

// Base design only; the final look comes from the designer.
export function InnovationForm({ initial, categories, submitLabel, isPending, error, onSubmit }: InnovationFormProps) {
  const [data, setData] = useState(initial)
  const set = (field: TextField) => (value: string) => setData((prev) => ({ ...prev, [field]: value }))

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Podstawowe informacje</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="title">Tytuł</FieldLabel>
              <Input id="title" required maxLength={300} value={data.title} onChange={(e) => set('title')(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="category">Kategoria</FieldLabel>
              <NativeSelect
                id="category"
                required
                className="w-full"
                value={data.categoryId || ''}
                onChange={(e) => setData((prev) => ({ ...prev, categoryId: Number(e.target.value) }))}
              >
                <NativeSelectOption value="" disabled>
                  Wybierz kategorię
                </NativeSelectOption>
                {categories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Treść</h2>
          </CardTitle>
          <CardDescription>Z tych pól wyszukiwarka dopasowuje innowację do problemów mieszkańców.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {sections.map(({ field, label, hint }) => (
              <Field key={field}>
                <FieldLabel htmlFor={field}>{label}</FieldLabel>
                <Textarea
                  id={field}
                  aria-describedby={`${field}-hint`}
                  rows={field === 'description' ? 8 : 3}
                  maxLength={10_000}
                  value={data[field]}
                  onChange={(e) => set(field)(e.target.value)}
                />
                <FieldDescription id={`${field}-hint`}>{hint}</FieldDescription>
              </Field>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Materiały</h2>
          </CardTitle>
          <CardDescription>Z linków powstają Akcje przy wyniku: film, dokument, pobranie, więcej informacji.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {links.map(({ field, label }) => (
              <Field key={field}>
                <FieldLabel htmlFor={field}>{label}</FieldLabel>
                <Input id={field} type="url" inputMode="url" placeholder="https://" value={data[field]} onChange={(e) => set(field)(e.target.value)} />
              </Field>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" size="lg" disabled={isPending} className="self-start">
        {isPending && <Spinner data-icon="inline-start" />}
        {submitLabel}
      </Button>
    </form>
  )
}
