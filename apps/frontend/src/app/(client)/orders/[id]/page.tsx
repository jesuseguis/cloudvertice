'use client'

import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useClientOrder } from '@/lib/hooks/use-orders'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Calendar,
  CreditCard,
  Server,
  ArrowLeft,
  Download,
} from 'lucide-react'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { order, isLoading } = useClientOrder(orderId)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: order?.currency || 'USD',
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-text-secondary animate-pulse mx-auto mb-4" />
          <p className="text-text-secondary">Cargando orden...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Orden no encontrada</h3>
            <p className="text-text-secondary mb-4">La orden que buscas no existe.</p>
            <Button onClick={() => router.push('/orders')}>Volver a mis órdenes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title={`Orden #${order.orderNumber}`}
        subtitle={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Producto Solicitado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Server className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white">
                      {order.product?.name || 'Producto'}
                    </h4>
                    <p className="text-sm text-text-secondary mt-1">
                      {order.product?.cpuCores || '-'} vCPU • {order.product?.ramMb ? Math.round(order.product.ramMb / 1024) : '-'}GB RAM • {order.region || 'EU'}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Período: {order.periodMonths} {order.periodMonths === 1 ? 'mes' : 'meses'}
                    </p>
                    {order.imageId && (
                      <p className="text-xs text-text-secondary mt-1">
                        ID de Imagen: {order.imageId}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned VPS Info */}
            {order.vpsInstance && (
              <Card className="border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-emerald-500" />
                    VPS Asignado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Nombre</span>
                    <span className="text-white font-mono">{order.vpsInstance.displayName || order.vpsInstance.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Dirección IP</span>
                    <span className="text-white font-mono">{order.vpsInstance.ipAddress || 'Pendiente'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Estado</span>
                    <span className="text-white"><StatusBadge status={order.vpsInstance.status.toLowerCase()} /></span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Historial</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Orden creada</p>
                      <p className="text-xs text-text-secondary">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  {order.status !== 'PENDING' && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Pago recibido</p>
                      </div>
                    </div>
                  )}
                  {(order.status === 'PROVISIONING' || order.status === 'COMPLETED') && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Provisionando</p>
                        <p className="text-xs text-text-secondary">
                          Configurando tu servidor
                        </p>
                      </div>
                    </div>
                  )}
                  {order.status === 'COMPLETED' && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Completado</p>
                        {order.completedAt && (
                          <p className="text-xs text-text-secondary">{formatDate(order.completedAt)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between font-medium">
                  <span className="text-white">Total</span>
                  <span className="text-white text-lg">{formatCurrency(order.totalAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Período de facturación</span>
                  <span className="text-white">{order.periodMonths} {order.periodMonths === 1 ? 'mes' : 'meses'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-text-secondary">Número de orden</p>
                  <p className="text-white font-mono">#{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Fecha de creación</p>
                  <p className="text-white">{formatDate(order.createdAt)}</p>
                </div>
                {order.vpsInstance && (
                  <div>
                    <p className="text-text-secondary">VPS asignado</p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-primary"
                      onClick={() => router.push(`/servers/${order.vpsInstance?.id}`)}
                    >
                      Ver servidor
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                {order.status === 'PAID' && (
                  <p className="text-sm text-text-secondary text-center">
                    Tu orden está siendo procesada
                  </p>
                )}
                {order.status === 'COMPLETED' && order.vpsInstance && (
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/servers/${order.vpsInstance?.id}`)}
                  >
                    <Server className="mr-2 h-4 w-4" />
                    Ver mi VPS
                  </Button>
                )}
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Descargar factura
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
