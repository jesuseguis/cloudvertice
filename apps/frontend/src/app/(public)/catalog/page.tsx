'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { publicApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ShoppingCart,
  Mail,
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  contaboProductId: string
  ramMb: number
  cpuCores: number
  diskGb: number
  diskType: 'NVMe' | 'SSD' | 'HDD'
  regions: string[]
  productType: 'STANDARD' | 'CUSTOM'
  contactEmail: string | null
  basePrice: number
  sellingPrice: number
  sortOrder: number
  isActive: boolean
}

export default function CatalogPage() {
  const router = useRouter()
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['public', 'products'],
    queryFn: () => publicApi.products(),
  })

  const { data: config } = useQuery({
    queryKey: ['public', 'config'],
    queryFn: () => publicApi.config(),
  })

  const annualDiscountPercent = config?.annualDiscountPercent || 17
  const annualDiscountMultiplier = config?.annualDiscountMultiplier || 0.83

  const filteredProducts = products.filter((p: Product) => p.isActive)

  const formatPrice = (product: Product) => {
    const price = product.sellingPrice
    const displayedPrice = billingPeriod === 'annual' ? price * 12 * annualDiscountMultiplier : price
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(displayedPrice)
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="border-b border-border-dark bg-card-dark/80 backdrop-blur">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">Cloud Vertice</a>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push('/login')}>
              Iniciar sesión
            </Button>
            <Button onClick={() => router.push('/register')}>
              Registrarse
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Servidores VPS
          </h1>
          <p className="text-text-secondary max-w-2xl mx-auto">
            Elige el plan perfecto para tu proyecto. Escala en cualquier momento.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-text-secondary'}`}>
            Mensual
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className={`w-14 h-7 rounded-full p-1 transition-colors ${
              billingPeriod === 'annual' ? 'bg-primary' : 'bg-card-dark border border-border-dark'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                billingPeriod === 'annual' ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm ${billingPeriod === 'annual' ? 'text-white' : 'text-text-secondary'}`}>
            Anual <span className="text-primary text-xs">(ahorra {annualDiscountPercent}%)</span>
          </span>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-80 animate-pulse bg-card-dark/50" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <Server className="h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No hay productos disponibles
              </h3>
              <p className="text-sm text-text-secondary">
                Vuelve más tarde para ver nuestros planes
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filteredProducts
              .sort((a: Product, b: Product) => a.sortOrder - b.sortOrder)
              .map((product: Product) => (
              <Card
                key={product.id}
                className="bg-card-dark border-border-dark hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        {product.productType === 'CUSTOM' && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Contactar
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{product.contaboProductId}</p>
                    </div>
                  </div>
                  {product.productType === 'STANDARD' && (
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">
                        {formatPrice(product)}
                      </span>
                      <span className="text-text-secondary">/mes</span>
                    </div>
                  )}
                  {product.productType === 'CUSTOM' && (
                    <div className="mt-4">
                      <span className="text-2xl font-bold text-text-secondary">
                        Precio personalizado
                      </span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Specs */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Cpu className="h-4 w-4 text-text-secondary" />
                      <span className="text-white">{product.cpuCores} vCPU</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <MemoryStick className="h-4 w-4 text-text-secondary" />
                      <span className="text-white">{Math.round(product.ramMb / 1024)} GB RAM</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <HardDrive className="h-4 w-4 text-text-secondary" />
                      <span className="text-white">
                        {product.diskGb} GB {product.diskType}
                      </span>
                    </div>
                  </div>

                  {/* Regions */}
                  {product.regions && product.regions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-text-secondary">Regiones disponibles:</p>
                      <div className="flex flex-wrap gap-1">
                        {product.regions.map((region, index) => (
                          <span
                            key={index}
                            className="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
                          >
                            {region}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.productType === 'STANDARD' ? (
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/checkout?product=${product.id}&billing=${billingPeriod}`)}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Comprar
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => router.push(`/checkout?product=${product.id}`)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Solicitar Presupuesto
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
