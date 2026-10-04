import { Outlet, createFileRoute } from '@tanstack/react-router'
import { MotionConfig } from 'motion/react'
import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useApplyPanelTheme } from '@/features/panel/theme'

// Each panel page owns its layout: the login centers a card, the logged-in pages get the sidebar.
// Save results across the panel show as toasts (features/panel/notify.ts). Animations follow the OS "reduce motion".
export const Route = createFileRoute('/panel')({
  component: PanelRoot,
})

function PanelRoot() {
  useApplyPanelTheme()
  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={300}>
        <Toaster>
          <div className="flex min-h-svh flex-col">
            <Outlet />
          </div>
        </Toaster>
      </TooltipProvider>
    </MotionConfig>
  )
}
