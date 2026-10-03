import { Field, FieldLabel } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { isHandlingStatus, statusLabel, type HandlingStatus } from './handling'

interface StatusFieldProps {
  id: string
  value: HandlingStatus
  onChange: (status: HandlingStatus) => void
  state: { isPending: boolean }
}

/** Stan picker for Potrzeba details and the Pomysł page; the save result shows as a toast. */
export function StatusField({ id, value, onChange, state }: StatusFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>Stan</FieldLabel>
      <NativeSelect
        id={id}
        value={value}
        disabled={state.isPending}
        onChange={(e) => isHandlingStatus(e.target.value) && onChange(e.target.value)}
      >
        {Object.entries(statusLabel).map(([status, label]) => (
          <NativeSelectOption key={status} value={status}>
            {label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  )
}
