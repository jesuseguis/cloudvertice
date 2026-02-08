'use client'

import { useRouter } from 'next/navigation'
import { useAdminProducts } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Home,
  Star,
  StarOff,
} from 'lucide-react'
import type { ProductStatus } from '@/types'
import { useState } from 'react'

export default function AdminProductsPage() {
  const router = useRouter()
  const {
    products,
    isLoading,
    deleteProduct,
    syncProducts,
    isSyncing,
    toggleHomeProduct,
    toggleRecommendedProduct,
    updateHomeOrder,
  } = useAdminProducts()

  const [editingHomeOrder, setEditingHomeOrder] = useState<string | null>(null)
  const [homeOrderValue, setHomeOrderValue] = useState('0')

  const getStatusLabel = (status: ProductStatus) => {
    const labels: Record<ProductStatus, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      draft: 'Borrador',
    }
    return labels[status]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      await deleteProduct(id)
    }
  }

  const handleSync = async () => {
    if (confirm('¿Estás seguro de sincronizar los productos desde Contabo? Esto puede crear o actualizar elementos existentes.')) {
      await syncProducts()
    }
  }

  const handleHomeOrderEdit = (productId: string, currentOrder: number) => {
    setEditingHomeOrder(productId)
    setHomeOrderValue(String(currentOrder))
  }

  const handleHomeOrderSave = (productId: string) => {
    const order = parseInt(homeOrderValue)
    if (!isNaN(order) && order >= 0 && order <= 2) {
      updateHomeOrder({ id: productId, homeOrder: order })
      setEditingHomeOrder(null)
    } else {
      alert('El orden debe ser un número entre 0 y 2')
    }
  }

  const getFeaturedProducts = () => products.filter(p => p.showOnHome)
  const featuredCount = getFeaturedProducts().length

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title="Productos"
        subtitle="Gestiona planes y precios"
        actions={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
            <Button onClick={() => router.push('/admin/products/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Home Products Info */}
        <Card className="bg-primary/10 border-primary/30">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-white">
                  Productos en el Home: {featuredCount}/3
                </p>
                <p className="text-xs text-text-secondary">
                  Selecciona máximo 3 productos para mostrar en la página principal
                </p>
              </div>
            </div>
          </div>
        </Card>

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
        ) : products.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <Package className="h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No hay productos</h3>
              <p className="text-sm text-text-secondary text-center mb-6">
                Sincroniza desde Contabo o crea un producto manualmente
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
                <Button onClick={() => router.push('/admin/products/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Producto
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Especificaciones</TableHead>
                  <TableHead>Precio Mensual</TableHead>
                  <TableHead>Contabo ID</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Home</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const status: ProductStatus = product.isActive ? 'active' : 'inactive'
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          <p className="text-xs text-text-secondary">{product.contaboProductId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{product.cpuCores} vCPU • {Math.round(product.ramMb / 1024)}GB RAM</p>
                          <p className="text-text-secondary">{product.diskGb}GB {product.diskType}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(product.sellingPrice)}</span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-background-dark px-2 py-1 rounded">
                          {product.contaboProductId}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                          ${status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                          ${status === 'inactive' ? 'bg-card-dark border border-border-dark text-text-secondary' : ''}
                          ${status === 'draft' ? 'bg-amber-500/20 text-amber-400' : ''}
                        `}>
                          {getStatusLabel(status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Toggle Home */}
                          <button
                            onClick={() => {
                              if (featuredCount >= 3 && !product.showOnHome) {
                                alert('Máximo 3 productos pueden mostrarse en el home')
                                return
                              }
                              toggleHomeProduct({ id: product.id, showOnHome: !product.showOnHome })
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              product.showOnHome
                                ? 'bg-primary/20 text-primary'
                                : 'bg-card-dark border border-border-dark text-text-secondary hover:border-primary/50'
                            }`}
                            title={product.showOnHome ? 'Quitar del home' : 'Mostrar en home'}
                          >
                            <Home className="h-4 w-4" />
                          </button>

                          {/* Toggle Recommended */}
                          <button
                            onClick={() => {
                              toggleRecommendedProduct({ id: product.id, isRecommended: !product.isRecommended })
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              product.isRecommended
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-card-dark border border-border-dark text-text-secondary hover:border-amber-500/50'
                            }`}
                            title={product.isRecommended ? 'Quitar recomendado' : 'Marcar como recomendado'}
                          >
                            {product.isRecommended ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                          </button>

                          {/* Home Order */}
                          {product.showOnHome && (
                            <div className="flex items-center gap-1">
                              {editingHomeOrder === product.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="2"
                                    value={homeOrderValue}
                                    onChange={(e) => setHomeOrderValue(e.target.value)}
                                    className="w-12 px-1 py-0.5 text-xs bg-background-dark border border-border-dark rounded text-white text-center"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleHomeOrderSave(product.id)
                                      if (e.key === 'Escape') setEditingHomeOrder(null)
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleHomeOrderSave(product.id)}
                                    className="p-0.5 text-green-400 hover:text-green-300"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => setEditingHomeOrder(null)}
                                    className="p-0.5 text-red-400 hover:text-red-300"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleHomeOrderEdit(product.id, product.homeOrder)}
                                  className="px-2 py-1 text-xs bg-background-dark border border-border-dark rounded text-text-secondary hover:border-primary/50"
                                  title="Orden en home (0-2)"
                                >
                                  #{product.homeOrder}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-400"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}
