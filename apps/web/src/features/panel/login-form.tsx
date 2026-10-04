import { useState, type FormEvent } from 'react'
import { PomostMark } from '@/components/brand/pomost-logo'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

interface LoginFormProps {
  onSubmit: (credentials: { email: string; password: string }) => void
  isPending: boolean
  error?: string
}

// Base design only; the final look comes from the designer.
export function LoginForm({ onSubmit, isPending, error }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSubmit({ email, password })
  }

  return (
    <Card className="w-full max-w-sm gap-6 rounded-3xl p-2 shadow-xl shadow-primary/10">
      <CardHeader className="gap-3">
        <span
          aria-hidden="true"
          className="flex size-11 items-center justify-center rounded-xl bg-white shadow-md shadow-primary/30"
        >
          <PomostMark onWhite className="size-8" />
        </span>
        <CardTitle>
          <h1 className="text-2xl font-[680] tracking-[-0.03em]">Panel administratora</h1>
        </CardTitle>
        <CardDescription>Zaloguj się kontem pracownika ROPS.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={error ? true : undefined}
                required
              />
            </Field>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel htmlFor="password">Hasło</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                required
              />
            </Field>
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner data-icon="inline-start" />}
              Zaloguj się
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
