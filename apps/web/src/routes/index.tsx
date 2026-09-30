import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/lib/trpc'

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(trpc.decisions.list.queryOptions()),
  component: DecidePage,
})

const formatConfidence = (confidence: number) => `${Math.round(confidence * 100)}%`

function DecidePage() {
  const [state, setState] = useState('')
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState('')

  const queryClient = useQueryClient()
  const history = useQuery(trpc.decisions.list.queryOptions())
  const decide = useMutation(
    trpc.decisions.create.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: trpc.decisions.list.queryKey() }),
    }),
  )

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    decide.mutate({
      state,
      question,
      options: options.split(',').map((o) => o.trim()).filter(Boolean),
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Decide</CardTitle>
          <CardDescription>Describe the situation, ask a question, list the options.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="state">Situation</Label>
              <Textarea id="state" value={state} onChange={(e) => setState(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="question">Question</Label>
              <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="options">Options (comma-separated)</Label>
              <Input
                id="options"
                placeholder="pizza, sushi, tacos"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={decide.isPending}>
              {decide.isPending ? 'Deciding…' : 'Decide'}
            </Button>
          </form>

          {decide.error && <p className="mt-4 text-sm text-destructive">{decide.error.message}</p>}
          {decide.data && (
            <p className="mt-4 text-sm">
              Answer: <strong>{decide.data.answer}</strong> ({formatConfidence(decide.data.confidence)} confident)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Answer</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
                <TableHead className="text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.data?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-normal">{d.question}</TableCell>
                  <TableCell>{d.answer}</TableCell>
                  <TableCell className="text-right">{formatConfidence(d.confidence)}</TableCell>
                  <TableCell className="text-right">{new Date(d.createdAt).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
