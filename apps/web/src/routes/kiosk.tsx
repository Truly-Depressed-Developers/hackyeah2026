import { createFileRoute } from '@tanstack/react-router'
import { KioskApp } from '@/features/kiosk/kiosk-app'

/**
 * Publiczna trasa kiosku — fizycznego tabletu stojącego w MOPS-ie, bibliotece czy
 * urzędzie. Celowo bez `validateSearch` i bez paramów: żaden tekst mieszkańca nie
 * trafia do URL-a, bo ekran jest współdzielony. Cały przepływ żyje w maszynie stanów.
 */
export const Route = createFileRoute('/kiosk')({
  component: KioskApp,
})
