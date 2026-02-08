'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminOperatingSystems } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewOperatingSystemPage() {
  const router = useRouter()
  const { createOperatingSystem, isCreating } = useAdminOperatingSystems()

  const [formData, setFormData] = useState({
    imageId: '',
    name: '',
    priceAdjustment: 0,
    sortOrder: 0,
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createOperatingSystem(formData)
      router.push('/admin/operating-systems')
    } catch (error) {
      console.error('Error creating operating system:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title="Nuevo Sistema Operativo"
        subtitle="Crea un nuevo sistema operativo con ajuste de precio"
        actions={
          <Button variant="ghost" onClick={() => router.push('/admin/operating-systems')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        }
      />

      <div className="p-6 lg:p-8">
        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Image ID */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Image ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.imageId}
                onChange={(e) => setFormData({ ...formData, imageId: e.target.value })}
                placeholder="Ej: ubuntu-22.04-cloud-img"
                className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-text-secondary mt-1">
                ID único de la imagen en Contabo
              </p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Ubuntu 22.04 LTS"
                className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Price Adjustment */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Ajuste de Precio
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.priceAdjustment}
                  onChange={(e) => setFormData({ ...formData, priceAdjustment: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-8 pr-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <p className="text-xs text-text-secondary mt-1">
                Valor positivo aumenta el precio, negativo lo disminuye
              </p>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Orden de Visualización
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-text-secondary mt-1">
                Menor valor aparece primero en la lista
              </p>
            </div>

            {/* Is Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-5 h-5 rounded border-border-dark bg-background-dark text-primary focus:ring-2 focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-white">
                Sistema operativo activo
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border-dark">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/admin/operating-systems')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? 'Creando...' : 'Crear Sistema Operativo'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
