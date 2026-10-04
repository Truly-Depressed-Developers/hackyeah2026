import { Outlet, createFileRoute } from '@tanstack/react-router'
import { LazyMotion, MotionConfig } from 'motion/react'
import { Toaster } from '@/components/ui/toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useApplyPanelTheme } from '@/features/panel/theme'

// Each panel page owns its layout: the login centers a card, the logged-in pages get the sidebar.
// Save results across the panel show as toasts (features/panel/notify.ts). Animations follow the OS "reduce motion"
// and their engine loads lazily (features/panel/motion-features.ts).
const motionFeatures = () => import('@/features/panel/motion-features').then((module) => module.default)

export const Route = createFileRoute('/panel')({
  component: PanelRoot,
})

function PanelRoot() {
  useApplyPanelTheme()
  return (
    <LazyMotion features={motionFeatures} strict>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delay={300}>
          <Toaster>
            <div className="flex min-h-svh flex-col">
              <Outlet />
            </div>
          </Toaster>
        </TooltipProvider>
      </MotionConfig>
    </LazyMotion>
  )
}
