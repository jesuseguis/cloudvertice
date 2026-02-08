'use client'

import type { ReactNode } from 'react'
import { Menu, Bell, Search, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/lib/stores/ui-store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  title?: string
  subtitle?: string | ReactNode
  actions?: ReactNode
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { toggleMobileMenu, sidebarCollapsed } = useUIStore()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border-dark bg-card-dark/95 backdrop-blur px-4 lg:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobileMenu}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title section */}
      <div className="flex-1">
        {title && (
          <div>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
            {subtitle && (
              typeof subtitle === 'string' ? (
                <p className="text-sm text-text-secondary">{subtitle}</p>
              ) : (
                <div className="text-sm text-text-secondary">{subtitle}</div>
              )
            )}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Custom actions passed as prop */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Search */}
        {!sidebarCollapsed && (
          <div className="hidden md:flex relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-64 pl-9 h-9"
            />
          </div>
        )}

        {/* Help */}
        <Button variant="ghost" size="icon" asChild>
          <a href="/support" target="_blank">
            <HelpCircle className="h-5 w-5" />
          </a>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notificaciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="font-medium text-white">Nuevo ticket</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Tienes un nuevo ticket de soporte pendiente
                </p>
                <span className="text-xs text-text-secondary">Hace 5 minutos</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-white">VPS activo</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Tu VPS mi-vps-01 está ahora activo
                </p>
                <span className="text-xs text-text-secondary">Hace 1 hora</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-white">Factura pendiente</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Tienes una factura pendiente de pago
                </p>
                <span className="text-xs text-text-secondary">Hace 2 días</span>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-primary">
              Ver todas las notificaciones
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
