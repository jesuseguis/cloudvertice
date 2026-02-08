'use client'

import { useRouter } from 'next/navigation'
import { useAdminMetrics, useAdminAnalytics } from '@/lib/hooks/use-admin'
import { useAdminOrders } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Server,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: metrics, isLoading: metricsLoading } = useAdminMetrics()
  const { data: analytics } = useAdminAnalytics('30d')
  const { orders: recentOrders } = useAdminOrders({ limit: 5 })

  return (
    <div className="min-h-screen bg-background-dark">
      <Header title="Dashboard" subtitle="Panel de administración" />

      <div className="p-6 lg:p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Revenue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Ingresos (Mes)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-text-secondary" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="h-8 bg-card-dark/50 rounded animate-pulse" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    ${metrics?.revenue?.thisMonth?.toLocaleString() || '0'}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {metrics?.revenue?.percentChange && metrics.revenue?.percentChange > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-500">
                          +{metrics.revenue.percentChange}%
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-500">
                          {metrics?.revenue?.percentChange || 0}%
                        </span>
                      </>
                    )}
                    <span className="text-xs text-text-secondary">vs mes anterior</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Órdenes Pendientes
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-text-secondary" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="h-8 bg-card-dark/50 rounded animate-pulse" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {metrics?.orders?.pending || 0}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    de {metrics?.orders?.total || 0} total
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                Clientes Activos
              </CardTitle>
              <Users className="h-4 w-4 text-text-secondary" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="h-8 bg-card-dark/50 rounded animate-pulse" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {metrics?.clients?.active || 0}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    +{metrics?.clients?.newThisMonth || 0} nuevos este mes
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* VPS */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">
                VPS Activos
              </CardTitle>
              <Server className="h-4 w-4 text-text-secondary" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <div className="h-8 bg-card-dark/50 rounded animate-pulse" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-white">
                    {metrics?.vps?.active || 0}
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {metrics?.vps?.provisioning || 0} en provisioning
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Orders */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Órdenes Pendientes</CardTitle>
              {metrics?.orders?.pending && metrics.orders.pending > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/orders?status=PENDING')}
                >
                  Ver todas
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {recentOrders && recentOrders.filter((o) => o.status === 'PENDING').length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">No hay órdenes pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders?.filter((o) => o.status === 'PENDING').slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 bg-background-dark rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">#{order.orderNumber}</p>
                        <p className="text-xs text-text-secondary">
                          {order.product?.name || 'VPS'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          ${order.totalAmount?.toFixed(2) || '0.00'}
                        </p>
                        <StatusBadge status={order.status} className="text-xs" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Alertas</CardTitle>
              {metrics?.tickets?.open && metrics.tickets.open > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/tickets?status=open')}
                >
                  Ver tickets
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {metrics?.tickets?.open === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-8 w-8 text-text-secondary mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">No hay alertas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics?.tickets?.open && metrics.tickets.open > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">Tickets de soporte abiertos</p>
                        <p className="text-xs text-text-secondary">
                          {metrics.tickets.open} tickets requieren atención
                        </p>
                      </div>
                    </div>
                  )}
                  {metrics?.orders?.processing && metrics.orders.processing > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <Server className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-white">Provisionamiento en curso</p>
                        <p className="text-xs text-text-secondary">
                          {metrics.orders.processing} órdenes en proceso
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
