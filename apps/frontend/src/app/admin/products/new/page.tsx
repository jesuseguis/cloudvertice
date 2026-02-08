'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAdminProducts } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Package } from 'lucide-react'
import type { DiskType } from '@/types'

export default function NewProductPage() {
  const router = useRouter()
  const { createProduct, isCreating } = useAdminProducts()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contaboProductId: '',
    ramGb: 1,
    cpuCores: 1,
    diskGb: 25,
    diskType: 'SSD' as DiskType,
    regions: 'US',
    productType: 'STANDARD' as 'STANDARD' | 'CUSTOM',
    contactEmail: '',
    basePrice: 0,
    sellingPrice: 0,
    sortOrder: 0,
    isActive: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await createProduct({
        name: formData.name,
        description: formData.description || undefined,
        contaboProductId: formData.contaboProductId,
        ramMb: Number(formData.ramGb) * 1024, // Convert GB to MB
        cpuCores: Number(formData.cpuCores),
        diskGb: Number(formData.diskGb),
        diskType: formData.diskType,
        regions: formData.regions.split(',').map(r => r.trim()).filter(r => r),
        productType: formData.productType,
        contactEmail: formData.contactEmail || undefined,
        basePrice: Number(formData.basePrice),
        sellingPrice: Number(formData.sellingPrice),
        sortOrder: Number(formData.sortOrder),
        isActive: formData.isActive,
      })
      router.push('/admin/products')
    } catch (error) {
      console.error('Error creating product:', error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title="Nuevo Producto"
        subtitle="Crea un nuevo plan de VPS"
        actions={
          <Button variant="ghost" onClick={() => router.back()}>
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
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Información Básica</h2>
                <p className="text-sm text-text-secondary">
                  Define los detalles principales del producto
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  placeholder="Ej: VPS 10 NVMe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="contaboProductId">ID de Contabo *</Label>
                <Input
                  id="contaboProductId"
                  placeholder="Ej: V91, V92, V94"
                  value={formData.contaboProductId}
                  onChange={(e) => handleInputChange('contaboProductId', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <textarea
                  id="description"
                  className="flex min-h-[80px] w-full rounded-md border border-border-dark bg-background-dark px-3 py-2 text-sm text-white placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe las características del producto..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpuCores">Núcleos CPU *</Label>
                  <Input
                    id="cpuCores"
                    type="number"
                    min="1"
                    value={formData.cpuCores}
                    onChange={(e) => handleInputChange('cpuCores', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ramGb">RAM (GB) *</Label>
                  <Input
                    id="ramGb"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.ramGb}
                    onChange={(e) => handleInputChange('ramGb', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="diskGb">Disco (GB) *</Label>
                  <Input
                    id="diskGb"
                    type="number"
                    min="10"
                    value={formData.diskGb}
                    onChange={(e) => handleInputChange('diskGb', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="diskType">Tipo de Disco *</Label>
                  <Select
                    value={formData.diskType}
                    onValueChange={(value) => handleInputChange('diskType', value as DiskType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NVMe">NVMe</SelectItem>
                      <SelectItem value="SSD">SSD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="regions">Regiones (separadas por coma) *</Label>
                <Input
                  id="regions"
                  placeholder="Ej: US,EU,AS"
                  value={formData.regions}
                  onChange={(e) => handleInputChange('regions', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="productType">Tipo de Producto *</Label>
                <Select
                  value={formData.productType}
                  onValueChange={(value) => handleInputChange('productType', value as 'STANDARD' | 'CUSTOM')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STANDARD">Estándar</SelectItem>
                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-text-secondary mt-1">
                  {formData.productType === 'CUSTOM' ? 'Los productos personalizados requieren contacto antes de la compra' : 'Producto con precio fijo'}
                </p>
              </div>

              {formData.productType === 'CUSTOM' && (
                <div>
                  <Label htmlFor="contactEmail">Email de Contacto *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="Ej: ventas@empresa.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    required={formData.productType === 'CUSTOM'}
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Los clientes serán redirigidos a este email para contacto
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Package className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Precios</h2>
                <p className="text-sm text-text-secondary">
                  Define el costo y precio de venta
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basePrice">Costo Base (USD) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', e.target.value)}
                    required
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Costo de Contabo
                  </p>
                </div>

                <div>
                  <Label htmlFor="sellingPrice">Precio de Venta (USD) *</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.sellingPrice}
                    onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                    required
                  />
                  <p className="text-xs text-text-secondary mt-1">
                    Margen: ${formData.basePrice > 0 ? Math.round(((formData.sellingPrice - formData.basePrice) / formData.sellingPrice) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sortOrder">Orden de Visualización</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 rounded border-border-dark bg-background-dark text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  />
                  <Label htmlFor="isActive" className="text-sm text-white">
                    Producto Activo
                  </Label>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creando...' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
