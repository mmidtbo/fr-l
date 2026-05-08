import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  LogOut,
  WashingMachine,
  ChevronUp,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'

type PageName = 'dashboard' | 'orders' | 'customers' | 'reports' | 'settings'

interface AppSidebarProps {
  currentPage: PageName
  onNavigate: (page: PageName) => void
}

const mainNav = [
  { page: 'dashboard' as PageName, label: 'Dashboard', icon: LayoutDashboard },
  { page: 'orders' as PageName, label: 'Pesanan', icon: ShoppingBag },
  { page: 'customers' as PageName, label: 'Pelanggan', icon: Users },
]

const ownerNav = [
  { page: 'reports' as PageName, label: 'Laporan', icon: BarChart3 },
  { page: 'settings' as PageName, label: 'Pengaturan', icon: Settings },
]

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { profile, signOut } = useAuth()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??'

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="Gresik Laundry">
              <div className="flex items-center gap-3 cursor-default select-none">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                  <WashingMachine className="size-4" />
                </div>
                {!isCollapsed && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Gresik Laundry</span>
                    <span className="truncate text-xs text-muted-foreground">Sistem Manajemen</span>
                  </div>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(({ page, label, icon: Icon }) => (
                <SidebarMenuItem key={page}>
                  <SidebarMenuButton
                    isActive={currentPage === page}
                    onClick={() => onNavigate(page)}
                    tooltip={label}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {profile?.role === 'owner' && (
          <SidebarGroup>
            <SidebarGroupLabel>Manajemen</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ownerNav.map(({ page, label, icon: Icon }) => (
                  <SidebarMenuItem key={page}>
                    <SidebarMenuButton
                      isActive={currentPage === page}
                      onClick={() => onNavigate(page)}
                      tooltip={label}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={profile?.name ?? 'Pengguna'}
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg shrink-0">
                    <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{profile?.name ?? 'Memuat...'}</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">
                      {profile?.role === 'owner' ? 'Pemilik' : 'Karyawan'}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
