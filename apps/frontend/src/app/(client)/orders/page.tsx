'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClientOrders } from '@/lib/hooks/use-orders'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Calendar,
  CreditCard,
  Eye,
  ChevronRight,
} from 'lucide-react'
import type { OrderStatus } from '@/types'

export default function OrdersPage() {
  const router = useRouter()
  const { orders, total, isLoading } = useClientOrders()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOrders = orders.filter((order) => {
    return statusFilter === 'all' || order.status === statusFilter
  })

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      PENDING: 'Pendiente',
      PAID: 'Pagado',
      PROCESSING: 'Procesando',
      PROVISIONING: 'Provisionando',
      COMPLETED: 'Completado',
      CANCELLED: 'Cancelado',
    }
    return labels[status] || status
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header title="Mis Órdenes" subtitle="Historial de pedidos" />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="PAID">Pagados</SelectItem>
                <SelectItem value="PROCESSING">Procesando</SelectItem>
                <SelectItem value="PROVISIONING">Provisionando</SelectItem>
                <SelectItem value="COMPLETED">Completados</SelectItem>
                <SelectItem value="CANCELLED">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => router.push('/catalog')}>
            Nueva orden
          </Button>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <Card>
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-card-dark/50 rounded w-1/4 mx-auto mb-4" />
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-card-dark/50 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {statusFilter !== 'all' ? 'No hay órdenes con este estado' : 'No tienes órdenes'}
              </h3>
              <p className="text-sm text-text-secondary text-center mb-6">
                {statusFilter !== 'all'
                  ? 'Intenta con otro filtro de estado'
                  : 'Comienza comprando tu primer VPS'}
              </p>
              {statusFilter === 'all' && (
                <Button onClick={() => router.push('/catalog')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Comprar VPS
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orden</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-white/5"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-mono text-sm">
                      #{order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-text-secondary" />
                        {formatDate(order.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/orders/${order.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}
