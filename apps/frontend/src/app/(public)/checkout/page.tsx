'use client'

import { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { publicApi, ordersApi, paymentsApi } from '@/lib/api'
import { useToast } from '@/lib/hooks/use-toast'
import { useAuthStore } from '@/lib/stores/auth-store'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  CreditCard,
  Lock,
  AlertCircle,
  Check,
  Loader2,
  Mail,
} from 'lucide-react'
import type { Product, Image } from '@/types'

// Add Region and OperatingSystem types
interface Region {
  id: string
  code: string
  name: string
  description: string | null
  priceAdjustment: number
  isActive: boolean
  sortOrder: number
}

interface OperatingSystem {
  id: string
  imageId: string
  name: string
  priceAdjustment: number
  isActive: boolean
  sortOrder: number
}

type CheckoutStep = 'config' | 'payment' | 'success'

// Force dynamic rendering for useSearchParams
export const dynamic = 'force-dynamic'

// Convert billing period to periodMonths
function getPeriodMonths(billingPeriod: 'monthly' | 'annual'): number {
  return billingPeriod === 'annual' ? 12 : 1
}

// Load Stripe once outside the component
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')

// Inner form component that uses Stripe hooks
function PaymentFormContent({
  selectedProduct,
  billingPeriod,
  selectedRegion,
  selectedImage,
  formatPrice,
  onBack,
  orderId,
  paymentIntentId,
}: {
  selectedProduct: Product
  billingPeriod: 'monthly' | 'annual'
  selectedRegion: string
  selectedImage: string
  formatPrice: () => string
  onBack: () => void
  orderId: string
  paymentIntentId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string>('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setMessage('El sistema de pago no está listo. Por favor recarga la página.')
      return
    }

    setIsProcessing(true)
    setMessage('')

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?order=${orderId}`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      setMessage(confirmError.message || 'Ocurrió un error al procesar el pago')
      toast({
        variant: 'destructive',
        title: 'Error en el pago',
        description: confirmError.message || 'Ocurrió un error al procesar el pago',
      })
    } else {
      // Payment successful - confirm with backend to update order
      try {
        await paymentsApi.confirm(paymentIntentId, orderId)
        toast({
          title: 'Pago completado',
          description: 'Tu orden ha sido procesada exitosamente',
        })
        router.push(`/checkout/success?order=${orderId}`)
      } catch (error) {
        console.error('Error confirming payment:', error)
        // Still redirect to success page as payment was successful
        router.push(`/checkout/success?order=${orderId}`)
      }
    }

    setIsProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 border border-border-dark rounded-lg bg-background-dark">
          <CreditCard className="h-5 w-5 text-text-secondary" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Tarjeta de crédito/débito</p>
            <p className="text-xs text-text-secondary">Visa, Mastercard, Amex</p>
          </div>
          <Lock className="h-4 w-4 text-text-secondary" />
        </div>

        <div className="p-4 border border-border-dark rounded-lg bg-background-dark">
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card'],
            }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Lock className="h-4 w-4" />
          <span>Pago seguro con encriptación SSL de 256-bit</span>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-medium">Error en el pago</p>
            <p className="text-text-secondary text-xs mt-1">{message}</p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Button type="submit" className="w-full" disabled={isProcessing || !stripe || !elements}>
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Procesando pago...
            </>
          ) : (
            `Pagar ${formatPrice()}`
          )}
        </Button>

        <Button type="button" variant="outline" className="w-full" onClick={onBack} disabled={isProcessing}>
          Atrás
        </Button>
      </div>
    </form>
  )
}

// Payment form component - receives clientSecret as prop
function PaymentForm({
  clientSecret,
  selectedProduct,
  billingPeriod,
  selectedRegion,
  selectedImage,
  formatPrice,
  onBack,
  orderId,
  paymentIntentId,
}: {
  clientSecret: string
  selectedProduct: Product
  billingPeriod: 'monthly' | 'annual'
  selectedRegion: string
  selectedImage: string
  formatPrice: () => string
  onBack: () => void
  orderId: string
  paymentIntentId: string
}) {
  // Memoize stripe options to prevent re-renders
  const stripeOptions = useMemo(() => ({
    clientSecret,
    appearance: { theme: 'night' as const },
  }), [clientSecret])

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <PaymentFormContent
        selectedProduct={selectedProduct}
        billingPeriod={billingPeriod}
        selectedRegion={selectedRegion}
        selectedImage={selectedImage}
        formatPrice={formatPrice}
        onBack={onBack}
        orderId={orderId}
        paymentIntentId={paymentIntentId}
      />
    </Elements>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isAuthenticated, refreshUser } = useAuthStore()

  const productId = searchParams.get('product')
  const billingPeriod = (searchParams.get('billing') as 'monthly' | 'annual' | null) || 'monthly'

  const [step, setStep] = useState<CheckoutStep>('config')
  const [selectedRegionId, setSelectedRegionId] = useState<string>('')
  const [selectedOsId, setSelectedOsId] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string>('EU-CENTRAL-1')
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [clientSecret, setClientSecret] = useState<string>('')
  const [orderId, setOrderId] = useState<string>('')
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')
  const [isCreatingPayment, setIsCreatingPayment] = useState(false)
  const [contactFormData, setContactFormData] = useState({ name: '', email: '', message: '' })
  const [isSubmittingContact, setIsSubmittingContact] = useState(false)

  const { data: products = [] } = useQuery({
    queryKey: ['public', 'products'],
    queryFn: () => publicApi.products(),
  })

  const { data: regions = [] } = useQuery({
    queryKey: ['public', 'regions'],
    queryFn: async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/regions`)
        const data = await response.json()
        return data.data || []
      } catch {
        return []
      }
    },
  })

  const { data: operatingSystems = [] } = useQuery({
    queryKey: ['public', 'operating-systems'],
    queryFn: async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/operating-systems`)
        const data = await response.json()
        return data.data || []
      } catch {
        return []
      }
    },
  })

  const { data: images = [] } = useQuery({
    queryKey: ['public', 'images'],
    queryFn: () => publicApi.images(),
  })

  const selectedProduct = products.find((p: Product) => p.id === productId)
  const typedImages = images as Image[]
  const typedRegions = regions as Region[]
  const typedOperatingSystems = operatingSystems as OperatingSystem[]

  // Find selected region and OS
  const selectedRegionData = typedRegions.find(r => r.id === selectedRegionId)
  const selectedOsData = typedOperatingSystems.find(os => os.id === selectedOsId)

  useEffect(() => {
    // Check authentication on mount
    refreshUser()
  }, [refreshUser])

  useEffect(() => {
    // Initialize defaults
    if (typedRegions.length > 0 && !selectedRegionId) {
      setSelectedRegionId(typedRegions[0].id)
      setSelectedRegion(typedRegions[0].code)
    }
    if (typedOperatingSystems.length > 0 && !selectedOsId) {
      setSelectedOsId(typedOperatingSystems[0].id)
      setSelectedImage(typedOperatingSystems[0].imageId)
    }
  }, [typedRegions, typedOperatingSystems, selectedRegionId, selectedOsId])

  useEffect(() => {
    if (!selectedProduct && products.length > 0) {
      router.push('/catalog')
    }
    if (typedImages.length > 0 && !selectedImage) {
      setSelectedImage(typedImages[0].id)
    }
  }, [selectedProduct, products, typedImages, selectedImage, router])

  // Calculate price breakdown
  const priceBreakdown = useMemo(() => {
    if (!selectedProduct) {
      return { basePrice: 0, regionPriceAdj: 0, osPriceAdj: 0, totalPrice: 0 }
    }

    const basePrice = selectedProduct.sellingPrice
    const periodMonths = billingPeriod === 'annual' ? 12 : 1
    let finalBasePrice = basePrice * periodMonths

    // Apply annual discount
    if (billingPeriod === 'annual') {
      finalBasePrice = finalBasePrice * 0.83
    }

    const regionPriceAdj = selectedRegionData?.priceAdjustment || 0
    const osPriceAdj = selectedOsData?.priceAdjustment || 0
    const totalPrice = finalBasePrice + regionPriceAdj + osPriceAdj

    return { basePrice: finalBasePrice, regionPriceAdj, osPriceAdj, totalPrice }
  }, [selectedProduct, billingPeriod, selectedRegionData, selectedOsData])

  const formatPrice = useCallback((amount?: number) => {
    const priceToFormat = amount !== undefined ? amount : priceBreakdown.totalPrice
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(priceToFormat)
  }, [priceBreakdown.totalPrice])

  const handleContinueToPayment = async () => {
    // Check if product is custom type
    if (selectedProduct?.productType === 'CUSTOM') {
      // For custom products, show contact form instead of payment
      toast({
        title: 'Producto personalizado',
        description: 'Este producto requiere contacto antes de la compra',
      })
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para completar tu compra',
      })
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      return
    }

    if (!selectedProduct || !selectedImage) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor selecciona todos los campos requeridos',
      })
      return
    }

    setIsCreatingPayment(true)
    try {
      // Step 1: Create the order with regionId and osId
      const order = await ordersApi.create({
        productId: selectedProduct.id,
        periodMonths: getPeriodMonths(billingPeriod),
        regionId: selectedRegionId,
        osId: selectedOsId,
        region: selectedRegion,
        imageId: selectedImage,
      })

      // Save the orderId
      setOrderId(order.id)

      // Step 2: Create PaymentIntent to get clientSecret
      const result = await paymentsApi.createIntent(order.id)
      setClientSecret(result.clientSecret)
      setPaymentIntentId(result.paymentIntentId)
      setStep('payment')
    } catch (error: unknown) {
      console.error('Error creating payment:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo inicializar el pago',
      })
    } finally {
      setIsCreatingPayment(false)
    }
  }

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Cargando...</p>
        </div>
      </div>
    )
  }

  // Show payment form with Elements when we have clientSecret
  if (step === 'payment' && clientSecret) {
    return (
      <div className="min-h-screen bg-background-dark">
        <header className="border-b border-border-dark bg-card-dark/80 backdrop-blur">
          <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
            <Logo />
            <Button variant="ghost" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Completar Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-background-dark rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary">Total a pagar</span>
                    <span className="text-white font-bold text-xl">{formatPrice()}</span>
                  </div>
                </div>
                <PaymentForm
                  clientSecret={clientSecret}
                  selectedProduct={selectedProduct}
                  billingPeriod={billingPeriod}
                  selectedRegion={selectedRegion}
                  selectedImage={selectedImage}
                  formatPrice={formatPrice}
                  onBack={() => setStep('config')}
                  orderId={orderId}
                  paymentIntentId={paymentIntentId}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="border-b border-border-dark bg-card-dark/80 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <Button variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step === 'config' ? 'text-primary' : 'text-text-secondary'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'config' ? 'bg-primary text-white' : 'bg-card-dark border border-border-dark'
                }`}>
                  1
                </div>
                <span className="text-sm hidden sm:inline">Configuración</span>
              </div>
              <div className={`w-12 h-0.5 ${step === 'payment' ? 'bg-primary' : 'bg-border-dark'}`} />
              <div className={`flex items-center gap-2 ${step === 'payment' || step === 'success' ? 'text-primary' : 'text-text-secondary'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === 'payment' || step === 'success' ? 'bg-primary text-white' : 'bg-card-dark border border-border-dark'
                }`}>
                  2
                </div>
                <span className="text-sm hidden sm:inline">Pago</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Custom Product Contact Form */}
              {selectedProduct?.productType === 'CUSTOM' && step === 'config' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Producto Personalizado</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-lg">
                      <Mail className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium text-white">Contacto Requerido</h4>
                        <p className="text-sm text-text-secondary mt-1">
                          Este producto requiere contacto directo con nuestro equipo de ventas antes de completar la compra.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nombre *</Label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={contactFormData.name}
                          onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                          className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Tu nombre"
                        />
                      </div>

                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={contactFormData.email}
                          onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                          className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="tu@email.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message">Mensaje *</Label>
                        <textarea
                          id="message"
                          required
                          rows={4}
                          value={contactFormData.message}
                          onChange={(e) => setContactFormData({ ...contactFormData, message: e.target.value })}
                          className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          placeholder="Describe tus requisitos y necesidades..."
                        />
                      </div>

                      <Button
                        className="w-full"
                        onClick={async () => {
                          if (!contactFormData.name || !contactFormData.email || !contactFormData.message) {
                            toast({
                              variant: 'destructive',
                              title: 'Campos requeridos',
                              description: 'Por favor completa todos los campos',
                            })
                            return
                          }

                          setIsSubmittingContact(true)
                          try {
                            // For custom products, send email directly
                            const mailtoLink = `mailto:${selectedProduct.contactEmail}?subject=Consulta sobre ${selectedProduct.name}&body=${encodeURIComponent(
                              `Nombre: ${contactFormData.name}\nEmail: ${contactFormData.email}\n\nMensaje:\n${contactFormData.message}`
                            )}`
                            window.location.href = mailtoLink

                            toast({
                              title: 'Redirigiendo a email',
                              description: 'Abre tu cliente de correo para completar el contacto',
                            })
                          } catch (error) {
                            console.error('Error:', error)
                          } finally {
                            setIsSubmittingContact(false)
                          }
                        }}
                        disabled={isSubmittingContact}
                      >
                        {isSubmittingContact ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar Consulta por Email
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Configuration Step */}
              {step === 'config' && selectedProduct?.productType !== 'CUSTOM' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configura tu VPS</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label>Región</Label>
                      <Select
                        value={selectedRegionId}
                        onValueChange={(value) => {
                          setSelectedRegionId(value)
                          const region = typedRegions.find(r => r.id === value)
                          if (region) setSelectedRegion(region.code)
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecciona una región" />
                        </SelectTrigger>
                        <SelectContent>
                          {typedRegions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              <div className="flex items-center justify-between gap-4">
                                <span>{region.name}</span>
                                {region.priceAdjustment !== 0 && (
                                  <span className={`text-xs ${region.priceAdjustment > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                    {region.priceAdjustment > 0 ? '+' : ''}{formatPrice(region.priceAdjustment)}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Sistema Operativo</Label>
                      <Select
                        value={selectedOsId}
                        onValueChange={(value) => {
                          setSelectedOsId(value)
                          const os = typedOperatingSystems.find(o => o.id === value)
                          if (os) setSelectedImage(os.imageId)
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecciona un sistema operativo" />
                        </SelectTrigger>
                        <SelectContent>
                          {typedOperatingSystems.map((os) => (
                            <SelectItem key={os.id} value={os.id}>
                              <div className="flex items-center justify-between gap-4">
                                <span>{os.name}</span>
                                {os.priceAdjustment !== 0 && (
                                  <span className={`text-xs ${os.priceAdjustment > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                                    {os.priceAdjustment > 0 ? '+' : ''}{formatPrice(os.priceAdjustment)}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Billing Period Selector */}
                    <div>
                      <Label>Período de Facturación</Label>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const url = new URL(window.location.href)
                            url.searchParams.set('billing', 'monthly')
                            window.history.pushState({}, '', url.toString())
                            window.location.reload()
                          }}
                          className={`p-4 rounded-lg border text-left transition-colors ${
                            billingPeriod === 'monthly'
                              ? 'border-primary bg-primary/10'
                              : 'border-border-dark bg-background-dark hover:border-border-dark/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">Mensual</span>
                            {billingPeriod === 'monthly' && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-text-secondary text-sm">
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(selectedProduct.sellingPrice)}/mes
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const url = new URL(window.location.href)
                            url.searchParams.set('billing', 'annual')
                            window.history.pushState({}, '', url.toString())
                            window.location.reload()
                          }}
                          className={`p-4 rounded-lg border text-left transition-colors ${
                            billingPeriod === 'annual'
                              ? 'border-primary bg-primary/10'
                              : 'border-border-dark bg-background-dark hover:border-border-dark/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-medium">Anual</span>
                            {billingPeriod === 'annual' && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-text-secondary text-sm">
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(selectedProduct.sellingPrice * 12)}/año
                          </p>
                          <p className="text-primary text-xs mt-1">
                            Ahorra 17%
                          </p>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Loading state when creating payment */}
              {(step === 'payment' && !clientSecret) && (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                      <p className="text-text-secondary">Preparando pago...</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Server className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white">{selectedProduct.name}</h4>
                      <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
                        <Cpu className="h-3 w-3" />
                        <span>{selectedProduct.cpuCores} vCPU</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                        <MemoryStick className="h-3 w-3" />
                        <span>{Math.round(selectedProduct.ramMb / 1024)} GB RAM</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                        <HardDrive className="h-3 w-3" />
                        <span>{selectedProduct.diskGb} GB {selectedProduct.diskType}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Precio base</span>
                      <span className="text-white">{formatPrice(priceBreakdown.basePrice)}</span>
                    </div>
                    {selectedRegionData && selectedRegionData.priceAdjustment !== 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Ajuste región ({selectedRegionData.name})</span>
                        <span className={selectedRegionData.priceAdjustment > 0 ? 'text-orange-400' : 'text-green-400'}>
                          {selectedRegionData.priceAdjustment > 0 ? '+' : ''}{formatPrice(selectedRegionData.priceAdjustment)}
                        </span>
                      </div>
                    )}
                    {selectedOsData && selectedOsData.priceAdjustment !== 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Ajuste SO ({selectedOsData.name})</span>
                        <span className={selectedOsData.priceAdjustment > 0 ? 'text-orange-400' : 'text-green-400'}>
                          {selectedOsData.priceAdjustment > 0 ? '+' : ''}{formatPrice(selectedOsData.priceAdjustment)}
                        </span>
                      </div>
                    )}
                    {billingPeriod === 'annual' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Descuento anual</span>
                        <span className="text-green-500">
                          -{formatPrice(selectedProduct.sellingPrice * 12 * 0.17)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Impuestos</span>
                      <span className="text-white">$0.00</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between font-medium">
                    <span className="text-white">Total</span>
                    <span className="text-white text-lg">{formatPrice()}</span>
                  </div>

                  {step === 'config' && (
                    <Button
                      className="w-full"
                      onClick={handleContinueToPayment}
                      disabled={isCreatingPayment}
                    >
                      {isCreatingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Preparando pago...
                        </>
                      ) : (
                        'Continuar al pago'
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Cargando...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
