'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUIStore } from '@/lib/stores/ui-store'
import { useAuth } from '@/lib/hooks'
import { Logo } from './logo'
import { SidebarItem } from './sidebar-item'
import { UserMenu } from './user-menu'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { SidebarNavItem } from '@/types/layout'

const clientNavItems: SidebarNavItem[] = [
  { href: '/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
  { href: '/servers', icon: 'Server', label: 'Servidores' },
  { href: '/orders', icon: 'ShoppingCart', label: 'Órdenes' },
  { href: '/billing', icon: 'CreditCard', label: 'Facturación' },
  { href: '/support', icon: 'MessageSquare', label: 'Soporte' },
  { href: '/profile', icon: 'User', label: 'Perfil' },
]

const adminNavItems: SidebarNavItem[] = [
  { href: '/admin/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
  { href: '/admin/orders', icon: 'ShoppingCart', label: 'Órdenes' },
  { href: '/admin/products', icon: 'Package', label: 'Productos' },
  { href: '/admin/regions', icon: 'Globe', label: 'Regiones' },
  { href: '/admin/operating-systems', icon: 'Cpu', label: 'Sistemas Operativos' },
  { href: '/admin/clients', icon: 'Users', label: 'Clientes' },
  { href: '/admin/vps', icon: 'Server', label: 'Todos los VPS' },
  { href: '/admin/tickets', icon: 'MessageSquare', label: 'Tickets' },
  { href: '/admin/settings', icon: 'Settings', label: 'Configuración' },
]

// Dynamic icon import
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function getIcon(name: string): LucideIcon {
  const Icon = (LucideIcons as Record<string, unknown>)[name] as LucideIcon
  if (!Icon) {
    return LucideIcons.Circle
  }
  return Icon
}

interface SidebarProps {
  variant?: 'client' | 'admin'
}

export function Sidebar({ variant = 'client' }: SidebarProps) {
  const router = useRouter()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { isAdmin, logout, user } = useAuth()

  const navItems = variant === 'admin' || isAdmin ? adminNavItems : clientNavItems

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // On mobile, sidebar is hidden by default (handled by mobile-nav)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <aside
      className={`
        hidden lg:flex flex-col h-screen bg-card-dark border-r border-border-dark
        transition-all duration-300
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border-dark">
        {!sidebarCollapsed && <Logo />}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="ml-auto"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = getIcon(item.icon)
            return (
              <li key={item.href}>
                <SidebarItem
                  href={item.href}
                  icon={Icon}
                  label={item.label}
                />
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Menu */}
      <div className="border-t border-border-dark p-3">
        {!sidebarCollapsed ? (
          <UserMenu />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={() => router.push('/profile')}
          >
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium">
              {user?.name
                ? user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : 'U'}
            </div>
          </Button>
        )}
      </div>
    </aside>
  )
}
