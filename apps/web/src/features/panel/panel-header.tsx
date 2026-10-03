import { Link } from '@tanstack/react-router'
import { IconChevronDown, IconLogout } from '@tabler/icons-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePanelLogout } from './use-panel-auth'

// Few sections, so a top bar rather than a sidebar.
const sections = [
  { to: '/panel', label: 'Start', exact: true },
  { to: '/panel/needs', label: 'Potrzeby', exact: false },
  { to: '/panel/ideas', label: 'Pomysły', exact: false },
  { to: '/panel/innovations', label: 'Innowacje', exact: false },
] as const

const navLink = buttonVariants({
  variant: 'ghost',
  className: 'h-10 px-3 aria-[current=page]:bg-muted aria-[current=page]:font-semibold',
})

export function PanelHeader({ user }: { user: { name: string; email: string } }) {
  const logout = usePanelLogout()
  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-1">
          <Link to="/panel" activeOptions={{ exact: true }} className="flex items-baseline gap-2 rounded-md">
            <span className="text-xl leading-6 font-[650] tracking-[-0.02em]">HubMI</span>
            <span className="text-sm text-muted-foreground">Panel administratora</span>
          </Link>
          <nav aria-label="Sekcje panelu">
            <ul className="flex flex-wrap items-center gap-1">
              {sections.map((section) => (
                <li key={section.to}>
                  <Link to={section.to} activeOptions={{ exact: section.exact }} className={navLink}>
                    {section.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger aria-label={`Konto: ${user.email}`} render={<Button variant="ghost" className="h-10 gap-2 px-2" />}>
            <Avatar aria-hidden="true" className="size-7">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden max-w-48 truncate sm:inline">{user.email}</span>
            <IconChevronDown aria-hidden="true" data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
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
      </div>
    </header>
  )
}
