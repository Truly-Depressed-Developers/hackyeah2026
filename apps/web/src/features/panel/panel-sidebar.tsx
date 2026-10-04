import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import {
  IconBooks,
  IconBulb,
  IconChartHistogram,
  IconDeviceDesktop,
  IconExternalLink,
  IconHeartHandshake,
  IconLayoutDashboard,
  IconLogout,
  IconMoon,
  IconSelector,
  IconSun,
  type Icon,
} from '@tabler/icons-react'
import { motion } from 'motion/react'
import { cn } from 'cn'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { newIdeasQuery, newNeedsQuery } from './inbox'
import { setPanelTheme, usePanelTheme, type PanelTheme } from './theme'
import { usePanelLogout } from './use-panel-auth'

type SectionPath = '/panel' | '/panel/needs' | '/panel/ideas' | '/panel/innovations' | '/panel/analytics'

export interface PanelSection {
  to: SectionPath
  label: string
  icon: Icon
  /** Colour of the icon chip: each section keeps its own hue, in the menu and in page headers. */
  chip: string
}

export const PANEL_SECTIONS = {
  start: { to: '/panel', label: 'Start', icon: IconLayoutDashboard, chip: 'from-[#3F86E0] to-[#7454C4] text-white' },
  needs: { to: '/panel/needs', label: 'Potrzeby', icon: IconHeartHandshake, chip: 'from-[#FF8A7A] to-[#E5487A] text-white' },
  ideas: { to: '/panel/ideas', label: 'Pomysły', icon: IconBulb, chip: 'from-[#2FC8B0] to-[#1E9BB8] text-white' },
  innovations: { to: '/panel/innovations', label: 'Innowacje', icon: IconBooks, chip: 'from-[#FFC64F] to-[#FF8F40] text-[#0F1B2D]' },
  analytics: { to: '/panel/analytics', label: 'Statystyki', icon: IconChartHistogram, chip: 'from-[#A98EF2] to-[#6A4FCB] text-white' },
} as const satisfies Record<string, PanelSection>

const GROUPS: { label?: string; items: (keyof typeof PANEL_SECTIONS)[] }[] = [
  { items: ['start'] },
  { label: 'Od mieszkańców', items: ['needs', 'ideas'] },
  { label: 'Baza wiedzy', items: ['innovations'] },
  { label: 'Wgląd', items: ['analytics'] },
]

/** The gradient square with a section's icon; reused by page headers so a section is recognisable at a glance. */
export function SectionChip({ section, className }: { section: PanelSection; className?: string }) {
  const Icon = section.icon
  return (
    <span aria-hidden="true" className={cn('inline-flex shrink-0 items-center justify-center rounded-lg bg-linear-135 shadow-sm', section.chip, className)}>
      <Icon stroke={2} />
    </span>
  )
}

const isActive = (pathname: string, to: SectionPath) =>
  to === '/panel' ? pathname === '/panel' || pathname === '/panel/' : pathname === to || pathname.startsWith(`${to}/`)

export function PanelSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = useLocation({ select: (location) => location.pathname })
  const { setOpenMobile } = useSidebar()
  const needs = useQuery(newNeedsQuery())
  const ideas = useQuery(newIdeasQuery())
  const counts: Partial<Record<keyof typeof PANEL_SECTIONS, number>> = { needs: needs.data?.total, ideas: ideas.data?.total }

  return (
    <Sidebar collapsible="icon" aria-label="Panel administratora">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="HubMI — Panel administratora" render={<Link to="/panel" onClick={() => setOpenMobile(false)} />}>
              <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-[0.625rem] bg-brand-gradient text-sm font-bold text-white shadow-md shadow-primary/30">
                H
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="text-[0.9375rem] font-[650] tracking-[-0.02em]">HubMI</span>
                <span className="truncate text-xs text-muted-foreground">Panel administratora</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <nav aria-label="Sekcje panelu">
          {GROUPS.map((group) => (
            <SidebarGroup key={group.items.join()} className="py-1">
              {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((key) => {
                    const section = PANEL_SECTIONS[key]
                    const active = isActive(pathname, section.to)
                    const count = counts[key]
                    return (
                      <SidebarMenuItem key={key}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={count ? `${section.label} · nowe: ${count}` : section.label}
                          className="relative h-10 data-active:bg-sidebar-accent data-active:font-semibold"
                          render={<Link to={section.to} activeOptions={{ exact: section.to === '/panel' }} onClick={() => setOpenMobile(false)} />}
                        >
                          {active && (
                            <motion.span
                              layoutId="panel-nav-active"
                              aria-hidden="true"
                              className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-brand-gradient"
                              transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                            />
                          )}
                          <span className="relative">
                            <SectionChip section={section} className="size-6 rounded-md [&_svg]:size-3.5" />
                            {count ? (
                              <span
                                aria-hidden="true"
                                className="absolute -top-1 -right-1 hidden size-2.5 rounded-full bg-rose-500 ring-2 ring-sidebar group-data-[collapsible=icon]:block"
                              />
                            ) : null}
                          </span>
                          <span>{section.label}</span>
                          {count ? <span className="sr-only">, nowe: {count}</span> : null}
                        </SidebarMenuButton>
                        {count ? (
                          <SidebarMenuBadge
                            aria-hidden="true"
                            className="top-2.5! rounded-full bg-rose-600 px-1.5 font-semibold text-white peer-hover/menu-button:text-white peer-data-active/menu-button:text-white"
                          >
                            {count > 99 ? '99+' : count}
                          </SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Strona mieszkańca" render={<a href="/" target="_blank" rel="noreferrer" />}>
              <IconExternalLink aria-hidden="true" />
              <span>
                Strona mieszkańca<span className="sr-only"> (otwiera się w nowej karcie)</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeMenu />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <AccountMenu user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

const THEMES: { value: PanelTheme; label: string; icon: Icon }[] = [
  { value: 'light', label: 'Jasny', icon: IconSun },
  { value: 'dark', label: 'Ciemny', icon: IconMoon },
  { value: 'system', label: 'Jak w systemie', icon: IconDeviceDesktop },
]

function ThemeMenu() {
  const { theme, dark } = usePanelTheme()
  const { isMobile } = useSidebar()
  const label = THEMES.find((t) => t.value === theme)!.label
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton tooltip={`Motyw: ${label}`} />}>
        {dark ? <IconMoon aria-hidden="true" /> : <IconSun aria-hidden="true" />}
        <span>
          Motyw: <span className="text-muted-foreground">{label}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={isMobile ? 'top' : 'right'} align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Motyw panelu</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setPanelTheme(value as PanelTheme)}>
            {THEMES.map(({ value, label: itemLabel, icon: ItemIcon }) => (
              <DropdownMenuRadioItem key={value} value={value}>
                <ItemIcon aria-hidden="true" />
                {itemLabel}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AccountMenu({ user }: { user: { name: string; email: string } }) {
  const logout = usePanelLogout()
  const { isMobile } = useSidebar()
  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Konto: ${user.email}`}
        render={<SidebarMenuButton size="lg" tooltip={user.email} className="data-popup-open:bg-sidebar-accent" />}
      >
        <Avatar aria-hidden="true" className="size-8 rounded-lg">
          <AvatarFallback className="rounded-lg bg-primary-soft font-semibold text-primary-strong">{initials}</AvatarFallback>
        </Avatar>
        <span className="flex min-w-0 flex-1 flex-col text-left leading-tight">
          <span className="truncate text-sm font-medium">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </span>
        <IconSelector aria-hidden="true" className="ml-auto" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side={isMobile ? 'top' : 'right'} align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="block font-medium text-foreground">{user.name}</span>
            <span className="block truncate font-normal">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => logout.mutate()} disabled={logout.isPending}>
            <IconLogout aria-hidden="true" />
            Wyloguj
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
