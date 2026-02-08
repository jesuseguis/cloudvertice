'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAdminRegions } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, Globe } from 'lucide-react'

export default function EditRegionPage() {
  const router = useRouter()
  const params = useParams()
  const regionId = params.id as string

  const { regions, updateRegion, isUpdating } = useAdminRegions()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    priceAdjustment: 0,
    sortOrder: 0,
    isActive: true,
  })

  // Load region data
  useEffect(() => {
    const region = regions.find((r) => r.id === regionId)
    if (region) {
      setFormData({
        code: region.code,
        name: region.name,
        description: region.description || '',
        priceAdjustment: region.priceAdjustment,
        sortOrder: region.sortOrder,
        isActive: region.isActive,
      })
      setLoading(false)
    } else if (regions.length > 0) {
      setNotFound(true)
      setLoading(false)
    }
  }, [regionId, regions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await updateRegion({ id: regionId, data: formData })
      router.push('/admin/regions')
    } catch (error) {
      console.error('Error updating region:', error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header title="Editar Región" />
        <div className="p-6 lg:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header title="Región No Encontrada" />
        <div className="p-6 lg:p-8">
          <Card className="p-8 text-center">
            <p className="text-text-secondary">La región no existe.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/admin/regions')}
            >
              Volver a Regiones
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title="Editar Región"
        subtitle={`Modificando: ${formData.name}`}
        actions={
          <Button variant="ghost" onClick={() => router.push('/admin/regions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        }
      />

      <div className="p-6 lg:p-8 max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Información de la Región</h2>
                <p className="text-sm text-text-secondary">
                  Modifica los detalles de la región
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  required
                  disabled
                  className="bg-card-dark/50"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Código único - no modificable
                </p>
              </div>

              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Describe la ubicación de la región..."
                />
              </div>

              <div>
                <Label htmlFor="priceAdjustment">Ajuste de Precio</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                  <Input
                    id="priceAdjustment"
                    type="number"
                    step="0.01"
                    value={formData.priceAdjustment}
                    onChange={(e) => handleInputChange('priceAdjustment', parseFloat(e.target.value) || 0)}
                    className="pl-8"
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {formData.priceAdjustment > 0 ? 'Este valor aumenta el precio final' : formData.priceAdjustment < 0 ? 'Este valor disminuye el precio final' : 'Sin ajuste de precio'}
                </p>
              </div>

              <div>
                <Label htmlFor="sortOrder">Orden de Visualización</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleInputChange('sortOrder', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-text-secondary mt-1">
                  Menor valor aparece primero
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="w-5 h-5 rounded border-border-dark bg-background-dark text-primary focus:ring-2 focus:ring-primary"
                />
                <Label htmlFor="isActive" className="text-sm text-white">
                  Región activa
                </Label>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/regions')}
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
