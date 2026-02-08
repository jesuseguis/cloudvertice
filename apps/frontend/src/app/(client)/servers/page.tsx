'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVpsInstances } from '@/lib/hooks/use-vps'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Server,
  Search,
  Plus,
} from 'lucide-react'
import { VpsCard } from './components/vps-card'

export default function ServersPage() {
  const router = useRouter()
  const { vpsList, isLoading } = useVpsInstances()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredVps = vpsList.filter((vps) => {
    const matchesSearch =
      (vps?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vps?.ipAddress || '').includes(searchQuery)
    const matchesStatus = statusFilter === 'all' || (vps?.status?.toLowerCase() || '') === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background-dark">
      <Header title="Mis Servidores" subtitle="Gestiona tus VPS" />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-1 w-full sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Buscar servidor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="running">Activos</SelectItem>
                <SelectItem value="stopped">Detenidos</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => router.push('/catalog')}>
            <Plus className="mr-2 h-4 w-4" />
            Comprar VPS
          </Button>
        </div>

        {/* Servers Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-48 animate-pulse bg-card-dark/50" />
            ))}
          </div>
        ) : filteredVps.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <Server className="h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchQuery || statusFilter !== 'all'
                  ? 'No se encontraron servidores'
                  : 'No tienes servidores'}
              </h3>
              <p className="text-sm text-text-secondary text-center mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Intenta con otros filtros de búsqueda'
                  : 'Comienza comprando tu primer VPS'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => router.push('/catalog')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Comprar VPS
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVps.map((vps) => (
              <VpsCard key={vps.id} vps={vps} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
