'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'
import { SidebarItem } from './sidebar-item'
import { UserMenu } from './user-menu'
import { useUIStore } from '@/lib/stores/ui-store'
import { useAuth } from '@/lib/hooks'
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
  { href: '/admin/clients', icon: 'Users', label: 'Clientes' },
  { href: '/admin/vps', icon: 'Server', label: 'Todos los VPS' },
  { href: '/admin/tickets', icon: 'MessageSquare', label: 'Tickets' },
  { href: '/admin/settings', icon: 'Settings', label: 'Configuración' },
]

// Dynamic icon import helper
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

function getIcon(name: string): LucideIcon {
  const Icon = (LucideIcons as Record<string, unknown>)[name] as LucideIcon
  if (!Icon) {
    return LucideIcons.Circle
  }
  return Icon
}

export function MobileNav() {
  const router = useRouter()
  const { mobileMenuOpen, closeMobileMenu } = useUIStore()
  const { isAdmin, user } = useAuth()

  const navItems = isAdmin ? adminNavItems : clientNavItems

  if (!mobileMenuOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-card-dark border-r border-border-dark">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-dark">
            <Logo />
            <Button
              variant="ghost"
              size="icon"
              onClick={closeMobileMenu}
            >
              <X className="h-5 w-5" />
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
            <UserMenu />
          </div>
        </div>
      </div>
    </div>
  )
}
