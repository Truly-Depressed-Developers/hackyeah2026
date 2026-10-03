import { toast } from '@/components/ui/toast'

// One voice for save results in the Panel administratora: a toast bottom-right that times out.

export function notifySuccess(title: string, description?: string) {
  toast.add({ type: 'success', title, description })
}

/** Errors stay longer and interrupt screen readers (high priority). */
export function notifyError(title: string, error?: { message: string }) {
  toast.add({ type: 'error', title, description: error?.message, priority: 'high', timeout: 8000 })
}
