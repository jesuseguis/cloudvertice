'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Logo } from '@/components/layout/logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { publicApi } from '@/lib/api'
import { type Product } from '@/types'
import {
  Server,
  Cpu,
  HardDrive,
  Shield,
  Zap,
  Globe,
  ArrowRight,
} from 'lucide-react'

export default function LandingPage() {
  const router = useRouter()

  // Fetch featured products from API
  const { data: featuredProducts = [], isLoading } = useQuery({
    queryKey: ['public', 'products', 'featured'],
    queryFn: () => publicApi.productsFeatured(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Alto Rendimiento',
      description: 'NVMe SSD y CPUs de última generación para máxima velocidad',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Auto Backup',
      description: 'Configura y olvídate. Seguridad de datos sin esfuerzo.',
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: '99.9% Uptime',
      description: 'Garantía de disponibilidad con redundancia automática',
    },
    {
      icon: <Server className="h-6 w-6" />,
      title: 'Múltiples Regiones',
      description: 'Datacenters en Europa, América y Asia',
    },
  ]

  // Helper to format product specs
  const formatSpecs = (product: Product) => ({
    cpu: `${product.cpuCores} vCPU`,
    ram: `${Math.round(product.ramMb / 1024)}GB`,
    disk: `${product.diskGb}GB ${product.diskType}`,
  })

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <header className="border-b border-border-dark bg-card-dark/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-text-secondary hover:text-white transition-colors">
              Características
            </Link>
            <Link href="#pricing" className="text-text-secondary hover:text-white transition-colors">
              Precios
            </Link>
            <Link href="/catalog" className="text-text-secondary hover:text-white transition-colors">
              Catálogo
            </Link>
          </nav>
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

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
              Servidores VPS de Alto Rendimiento
            </h1>
            <p className="text-xl text-text-secondary mb-8">
              Potencia tus proyectos con servidores virtuales rápidos, seguros y escalables.
              Despliega en minutos con nuestra infraestructura cloud.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => router.push('/catalog')}>
                Ver planes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/register')}>
                Comenzar gratis
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-card-dark/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Todo lo que necesitas para crecer
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Servidores optimizados para aplicaciones web, bases de datos, desarrollo y más
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card-dark border-border-dark">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-text-secondary">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Planes para cada necesidad
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Comienza pequeño y escala según crece tu proyecto
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-card-dark border-border-dark animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-6 bg-card-dark/50 rounded mb-4 w-1/2" />
                    <div className="h-8 bg-card-dark/50 rounded mb-6 w-3/4" />
                    <div className="space-y-3 mb-6">
                      <div className="h-4 bg-card-dark/50 rounded" />
                      <div className="h-4 bg-card-dark/50 rounded" />
                      <div className="h-4 bg-card-dark/50 rounded" />
                    </div>
                    <div className="h-10 bg-card-dark/50 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {featuredProducts.map((product) => {
                const specs = formatSpecs(product)
                const isRecommended = product.isRecommended

                return (
                  <Card
                    key={product.id}
                    className={`bg-card-dark border-border-dark ${
                      isRecommended ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      {isRecommended && (
                        <div className="text-xs font-medium text-primary mb-4">Recomendado</div>
                      )}
                      <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-white">${product.sellingPrice}</span>
                        <span className="text-text-secondary">/mes</span>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Cpu className="h-4 w-4 text-text-secondary" />
                          <span className="text-white">{specs.cpu}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <HardDrive className="h-4 w-4 text-text-secondary" />
                          <span className="text-white">{specs.ram} RAM</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Server className="h-4 w-4 text-text-secondary" />
                          <span className="text-white">{specs.disk}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        variant={isRecommended ? 'default' : 'outline'}
                        onClick={() => router.push(`/catalog?product=${product.id}`)}
                      >
                        Seleccionar
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-text-secondary">No hay productos disponibles en este momento.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card-dark/30">
        <div className="container mx-auto px-4 lg:px-8">
          <Card className="bg-primary/10 border-primary/30">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                ¿Listo para comenzar?
              </h2>
              <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
                Únete a cientos de desarrolladores que confían en Cloud Vertice para sus proyectos
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => router.push('/register')}>
                  Crear cuenta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/catalog')}>
                  Ver catálogo completo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border-dark">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo />
            <p className="text-sm text-text-secondary">
              © {new Date().getFullYear()} Cloud Vertice. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm text-text-secondary hover:text-white transition-colors">
                Términos
              </Link>
              <Link href="/privacy" className="text-sm text-text-secondary hover:text-white transition-colors">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
