'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAdminOperatingSystems } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Cpu } from 'lucide-react'

export default function EditOperatingSystemPage() {
  const router = useRouter()
  const params = useParams()
  const osId = params.id as string

  const { operatingSystems, updateOperatingSystem, updatePrice, isUpdating, isUpdatingPrice } = useAdminOperatingSystems()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [priceValue, setPriceValue] = useState(0)

  const [formData, setFormData] = useState({
    imageId: '',
    name: '',
    priceAdjustment: 0,
    sortOrder: 0,
    isActive: true,
  })

  // Load OS data
  useEffect(() => {
    const os = operatingSystems.find((o) => o.id === osId)
    if (os) {
      setFormData({
        imageId: os.imageId,
        name: os.name,
        priceAdjustment: os.priceAdjustment,
        sortOrder: os.sortOrder,
        isActive: os.isActive,
      })
      setPriceValue(os.priceAdjustment)
      setLoading(false)
    } else if (operatingSystems.length > 0) {
      setNotFound(true)
      setLoading(false)
    }
  }, [osId, operatingSystems])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateOperatingSystem({ id: osId, data: formData })
      router.push('/admin/operating-systems')
    } catch (error) {
      console.error('Error updating OS:', error)
    }
  }

  const handleUpdatePrice = async () => {
    try {
      await updatePrice({ id: osId, priceAdjustment: Number(priceValue) })
      setFormData({ ...formData, priceAdjustment: Number(priceValue) })
    } catch (error) {
      console.error('Error updating price:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header title="Editar Sistema Operativo" />
        <div className="p-6 lg:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header title="Sistema Operativo No Encontrado" />
        <div className="p-6 lg:p-8">
          <Card className="p-8 text-center">
            <p className="text-text-secondary">El sistema operativo no existe.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/admin/operating-systems')}
            >
              Volver a Sistemas Operativos
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title="Editar Sistema Operativo"
        subtitle={`Modificando: ${formData.name}`}
        actions={
          <Button variant="ghost" onClick={() => router.push('/admin/operating-systems')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        }
      />

      <div className="p-6 lg:p-8 max-w-3xl">
        {/* Quick Price Update */}
        <Card className="mb-6 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Cpu className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Precio de Ajuste</h2>
              <p className="text-sm text-text-secondary">
                Modifica rápidamente el precio adicional para este sistema operativo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="quickPrice">Ajuste de Precio</Label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                <Input
                  id="quickPrice"
                  type="number"
                  step="0.01"
                  value={priceValue}
                  onChange={(e) => setPriceValue(parseFloat(e.target.value) || 0)}
                  className="pl-8"
                />
              </div>
            </div>
            <Button
              onClick={handleUpdatePrice}
              disabled={isUpdatingPrice || isUpdating}
              className="mt-6"
            >
              {isUpdatingPrice ? 'Actualizando...' : 'Actualizar Precio'}
            </Button>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Cpu className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Información General</h2>
                <p className="text-sm text-text-secondary">
                  Modifica los detalles del sistema operativo
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="imageId">Image ID *</Label>
                <Input
                  id="imageId"
                  value={formData.imageId}
                  onChange={(e) => setFormData({ ...formData, imageId: e.target.value })}
                  required
                  disabled
                  className="bg-card-dark/50"
                />
                <p className="text-xs text-text-secondary mt-1">
                  ID único de Contabo - no modificable
                </p>
              </div>

              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="priceAdjustment">Ajuste de Precio</Label>
                <Input
                  id="priceAdjustment"
                  type="number"
                  step="0.01"
                  value={formData.priceAdjustment}
                  onChange={(e) => setFormData({ ...formData, priceAdjustment: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="sortOrder">Orden de Visualización</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-border-dark bg-background-dark text-primary focus:ring-2 focus:ring-primary"
                />
                <Label htmlFor="isActive" className="text-sm text-white">
                  Sistema operativo activo
                </Label>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/operating-systems')}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
