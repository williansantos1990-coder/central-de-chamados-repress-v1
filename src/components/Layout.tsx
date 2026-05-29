import { Outlet, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { LayoutDashboard, Ticket, FilePlus, BarChart3, Settings, LogOut, Bell } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function Layout() {
  const { user, profile, loading, signOut } = useAuth()
  const location = useLocation()

  if (loading)
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  const navItems = [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard, roles: ['requester', 'agent', 'admin'] },
    {
      title: profile?.role === 'requester' ? 'Meus Chamados' : 'Todos os Chamados',
      url: '/tickets',
      icon: Ticket,
      roles: ['requester', 'agent', 'admin'],
    },
    {
      title: 'Novo Chamado',
      url: '/tickets/new',
      icon: FilePlus,
      roles: ['requester', 'agent', 'admin'],
    },
    { title: 'Relatórios', url: '/reports', icon: BarChart3, roles: ['agent', 'admin'] },
    { title: 'Administração', url: '/admin', icon: Settings, roles: ['admin'] },
  ].filter((item) => item.roles.includes(profile?.role || ''))

  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="h-16 flex items-center px-4 border-b">
          <div className="font-bold text-lg text-primary flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground">
              R
            </div>
            Repress
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        location.pathname === item.url ||
                        (location.pathname.startsWith(item.url) && item.url !== '/')
                      }
                    >
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback>{profile?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-medium truncate">{profile?.full_name}</span>
              <span className="text-xs text-muted-foreground truncate capitalize">
                {profile?.role}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold capitalize hidden sm:block">
              {location.pathname === '/'
                ? 'Dashboard'
                : location.pathname.split('/')[1] || 'Detalhes'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
