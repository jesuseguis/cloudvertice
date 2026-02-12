'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks'
import { useVpsInstances } from '@/lib/hooks/use-vps'
import { useClientOrders } from '@/lib/hooks/use-orders'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  CreditCard,
  MessageSquare,
  Server,
  ArrowUpRight,
  Plus,
  Clock,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { vpsList, isLoading: vpsLoading } = useVpsInstances()
  const { orders, isLoading: ordersLoading } = useClientOrders()

  const activeVps = vpsList.filter((v) => v.status === 'RUNNING').length
  const activeOrders = orders.filter((o) => o.status === 'COMPLETED' || o.status === 'PAID').length

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title={`Hola, ${user?.name?.split(' ')[0] || 'Usuario'}`}
        subtitle="Bienvenido a tu panel de control"
      />

      <div className="p-6 lg:p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                VPS Activos
              </CardTitle>
              <Server className="h-4 w-4 text-text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeVps}</div>
              <p className="text-xs text-text-secondary mt-1">
                de {vpsList.length} servidores totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Total Gastado
              </CardTitle>
              <CreditCard className="h-4 w-4 text-text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {ordersLoading ? (
                  <div className="h-6 bg-card-dark/50 rounded animate-pulse w-20" />
                ) : (
                  orders
                    .filter((o) => o.status === 'COMPLETED' || o.status === 'PAID')
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                    .toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1">
                En {orders.filter((o) => o.status === 'COMPLETED' || o.status === 'PAID').length} orden{orders.filter((o) => o.status === 'COMPLETED' || o.status === 'PAID').length !== 1 ? 'es' : ''} pagada{orders.filter((o) => o.status === 'COMPLETED' || o.status === 'PAID').length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Órdenes Activas
              </CardTitle>
              <Activity className="h-4 w-4 text-text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{activeOrders}</div>
              <p className="text-xs text-text-secondary mt-1">
                {orders.length} ordenes totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Tickets Abiertos
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-text-secondary mt-1">
                Sin tickets pendientes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/catalog')}
            >
              <Plus className="h-5 w-5" />
              <span>Comprar VPS</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/servers')}
            >
              <Server className="h-5 w-5" />
              <span>Mis Servidores</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/support')}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Soporte</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
              onClick={() => router.push('/orders')}
            >
              <Clock className="h-5 w-5" />
              <span>Mis Órdenes</span>
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Actividad Reciente</h2>
            <Button variant="ghost" size="sm" className="text-primary">
              Ver todo
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          {vpsList.length === 0 && orders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Server className="h-12 w-12 text-text-secondary mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No tienes actividad reciente
                </h3>
                <p className="text-sm text-text-secondary text-center mb-6">
                  Comienza comprando tu primer VPS
                </p>
                <Button onClick={() => router.push('/catalog')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Comprar VPS
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border-dark">
                  {vpsList.slice(0, 5).map((vps) => (
                    <div
                      key={vps.id}
                      className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => router.push(`/servers/${vps.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Server className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{vps.name}</p>
                          <p className="text-xs text-text-secondary">
                            {vps.specs?.cpuCores} vCPU • {vps.specs?.ramGB}GB RAM • {vps.specs?.diskGB}GB {vps.specs?.diskType}
                          </p>
                        </div>
                      </div>
                      <Badge variant={vps.status === 'RUNNING' ? 'success' : 'secondary'}>
                        {vps.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
