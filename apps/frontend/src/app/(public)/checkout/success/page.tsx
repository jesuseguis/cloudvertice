'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  Clock,
  Mail,
  FileText,
} from 'lucide-react'
import { ordersApi } from '@/lib/api'

interface OrderDetails {
  id: string
  status: string
  totalAmount: number
  currency: string
  product: {
    name: string
    cpuCores: number
    ramMb: number
    diskGb: number
    diskType: string
  }
  region: string
  billingPeriod: 'monthly' | 'annual'
  createdAt: string
}

export const dynamic = 'force-dynamic'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const paymentIntent = searchParams.get('payment_intent')
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrderDetails() {
      if (orderId) {
        try {
          const order = await ordersApi.byId(orderId)
          setOrderDetails(order as unknown as OrderDetails)
        } catch (error) {
          console.error('Failed to fetch order details:', error)
        }
      }
      setLoading(false)
    }

    fetchOrderDetails()
  }, [orderId])

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: orderDetails?.currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="border-b border-border-dark bg-card-dark/80 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>
            Ir al Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ¡Pago Completado!
            </h1>
            <p className="text-text-secondary">
              Tu orden ha sido procesada exitosamente
            </p>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-text-secondary">Cargando detalles...</p>
                </div>
              </CardContent>
            </Card>
          ) : orderDetails ? (
            <>
              {/* Order Details Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Detalles de la Orden</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-border-dark">
                    <span className="text-text-secondary">Número de orden</span>
                    <span className="text-white font-mono">{orderDetails.id.slice(0, 8).toUpperCase()}</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-border-dark">
                    <span className="text-text-secondary">Producto</span>
                    <span className="text-white font-medium">{orderDetails.product.name}</span>
                  </div>

                  <div className="py-3 border-b border-border-dark">
                    <div className="text-text-secondary mb-2">Especificaciones</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-white">
                        {orderDetails.product.cpuCores} vCPU
                      </div>
                      <div className="text-white">
                        {Math.round(orderDetails.product.ramMb / 1024)} GB RAM
                      </div>
                      <div className="text-white">
                        {orderDetails.product.diskGb} GB {orderDetails.product.diskType}
                      </div>
                      <div className="text-white">
                        {orderDetails.region}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-border-dark">
                    <span className="text-text-secondary">Período de facturación</span>
                    <span className="text-white capitalize">
                      {orderDetails.billingPeriod === 'monthly' ? 'Mensual' : 'Anual'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-3">
                    <span className="text-white font-medium">Total pagado</span>
                    <span className="text-white font-bold text-lg">
                      {formatPrice(orderDetails.totalAmount)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Próximos Pasos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-medium">1</span>
                      </div>
                      <div>
                        <p className="text-white text-sm">
                          Recibirás un correo de confirmación en breve
                        </p>
                        <p className="text-text-secondary text-xs mt-1">
                          Incluye todos los detalles de tu compra
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-medium">2</span>
                      </div>
                      <div>
                        <p className="text-white text-sm">
                          Tu VPS será provisionado por nuestro equipo
                        </p>
                        <p className="text-text-secondary text-xs mt-1">
                          Generalmente tarda menos de 24 horas
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs text-primary font-medium">3</span>
                      </div>
                      <div>
                        <p className="text-white text-sm">
                          Recibirás las credenciales de acceso por correo
                        </p>
                        <p className="text-text-secondary text-xs mt-1">
                          IP, usuario root y contraseña temporal
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1"
                  onClick={() => router.push('/dashboard')}
                >
                  Ir a mi Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push(`/orders/${orderDetails.id}`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Orden Completa
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-text-secondary mb-6">
                    No se pudieron cargar los detalles de la orden
                  </p>
                  <Button onClick={() => router.push('/dashboard')}>
                    Ir al Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="mt-6 border-primary/30 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-white text-sm font-medium mb-1">
                    ¿Necesitas ayuda?
                  </p>
                  <p className="text-text-secondary text-sm">
                    Contáctanos en{' '}
                    <a href="mailto:soporte@cloudvertice.com" className="text-primary hover:underline">
                      soporte@cloudvertice.com
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Cargando...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
