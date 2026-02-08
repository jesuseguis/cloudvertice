'use client'

import { useRouter } from 'next/navigation'
import { useAdminRegions } from '@/lib/hooks/use-admin'
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
  Globe,
  Plus,
  Edit,
  Trash2,
  ToggleRight,
  ToggleLeft,
  RefreshCw,
} from 'lucide-react'

export default function AdminRegionsPage() {
  const router = useRouter()
  const { regions, isLoading, deleteRegion, toggleRegion, syncRegions, isSyncing } = useAdminRegions()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta región?')) {
      await deleteRegion(id)
    }
  }

  const handleToggle = async (id: string) => {
    await toggleRegion(id)
  }

  const handleSync = async () => {
    if (confirm('¿Estás seguro de sincronizar las regiones desde Contabo? Esto puede crear o actualizar elementos existentes.')) {
      await syncRegions()
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title="Regiones"
        subtitle="Gestiona regiones y precios adicionales"
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
            <Button onClick={() => router.push('/admin/regions/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Región
            </Button>
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
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
        ) : regions.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <Globe className="h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No hay regiones</h3>
              <p className="text-sm text-text-secondary text-center mb-6">
                Sincroniza desde Contabo o crea una región manualmente
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
                <Button onClick={() => router.push('/admin/regions/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Región
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
                  <TableHead>Código</TableHead>
                  <TableHead>Ajuste de Precio</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell>
                      <p className="font-medium text-white">{region.name}</p>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-background-dark px-2 py-1 rounded">
                        {region.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${region.priceAdjustment > 0 ? 'text-green-400' : region.priceAdjustment < 0 ? 'text-red-400' : 'text-text-secondary'}`}>
                        {region.priceAdjustment > 0 ? '+' : ''}{formatCurrency(region.priceAdjustment)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-text-secondary">{region.description || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${region.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-card-dark border border-border-dark text-text-secondary'}
                      `}>
                        {region.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/admin/regions/${region.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggle(region.id)}
                          title={region.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {region.isActive ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4 text-text-secondary" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-400"
                          onClick={() => handleDelete(region.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}
