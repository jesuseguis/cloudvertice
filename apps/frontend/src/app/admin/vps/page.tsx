'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminContaboAvailable } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Server,
  RefreshCw,
  Globe,
  Cpu,
  MemoryStick,
  HardDrive,
  Check,
  X,
} from 'lucide-react'

interface ContaboInstance {
  tenantId?: string
  customerId?: string
  additionalIps?: any[]
  instanceId?: string | number
  name?: string
  displayName?: string
  dataCenter?: string
  region?: string
  regionName?: string
  productId?: string
  productName?: string
  imageId?: string
  imageName?: string
  image?: {
    imageId?: string
    name?: string
    description?: string
    osType?: string
    osVersion?: string
  }
  ipConfig?: {
    v4?: { ip?: string; gateway?: string }
    v6?: { ip?: string; gateway?: string }
  }
  macAddress?: string
  ramMb?: number
  cpuCores?: number
  osType?: string
  osVersion?: string
  diskMb?: number
  createdDate?: string
  creationDate?: string
  status?: string
  vHostId?: number
  productType?: string
  defaultUser?: string
  monthlyPrice?: number
  // Legacy fields for compatibility
  configDetails?: {
    cpu: number
    ram: number
    disk: number
  }
  specs?: {
    cores: number
    ramInMB: number
    diskSizeInGB: number
    cpu?: number
    ram?: number
    disk?: number
  }
  configuration?: {
    cpu: number
    ram: number
    disk: number
  }
  cpu?: number
  cores?: number
  ram?: number
  disk?: number
  createDate?: string
  [key: string]: any
}

export default function AdminAllVpsPage() {
  const router = useRouter()
  const { instances, count, isLoading, error, refetch } = useAdminContaboAvailable()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredInstances = instances.filter((instance: ContaboInstance) => {
    return statusFilter === 'all' || instance.status.toLowerCase() === statusFilter.toLowerCase()
  })

  // Helper functions to safely get specs - updated for actual Contabo API structure
  const getCpu = (instance: ContaboInstance) => {
    // Contabo API returns cpuCores directly on the instance
    return instance.cpuCores ?? 0
  }

  const getRam = (instance: ContaboInstance) => {
    // Contabo API returns ramMb directly on the instance
    const ramMb = instance.ramMb ?? 0
    // Convert MB to GB for display
    return Math.round(ramMb / 1024)
  }

  const getDisk = (instance: ContaboInstance) => {
    // Contabo API returns diskMb directly on the instance
    const diskMb = instance.diskMb ?? 0
    // Convert MB to GB for display
    return Math.round(diskMb / 1024)
  }

  // Helper to get IP address
  const getIp = (instance: ContaboInstance) => {
    return instance.ipConfig?.v4?.ip || 'N/A'
  }

  // Helper to get OS type
  const getOsType = (instance: ContaboInstance) => {
    return instance.osType || 'N/A'
  }

  // Helper to get product name
  const getProductName = (instance: ContaboInstance) => {
    return instance.productName || instance.productId || 'N/A'
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'text-emerald-500'
      case 'stopped':
        return 'text-text-secondary'
      case 'creating':
        return 'text-amber-500'
      default:
        return 'text-red-500'
    }
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title="Instancias Disponibles"
        subtitle={`Total: ${count} instancias de Contabo sin asignar`}
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Actions */}
        <div className="flex items-center justify-between">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="running">Activas</SelectItem>
              <SelectItem value="stopped">Detenidas</SelectItem>
              <SelectItem value="creating">Creando</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refrescar
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <div className="p-4 text-red-400">
              Error al cargar las instancias: {error instanceof Error ? error.message : 'Error desconocido'}
            </div>
          </Card>
        )}

        {/* Instances Table */}
        {isLoading ? (
          <Card>
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-card-dark/50 rounded" />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ) : filteredInstances.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <Server className="h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No hay instancias disponibles
              </h3>
              <p className="text-sm text-text-secondary">
                {statusFilter !== 'all'
                  ? 'Intenta con otro filtro'
                  : 'Todas las instancias de Contabo están asignadas a clientes'}
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instancia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Especificaciones</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Región</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>SO</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstances.map((instance: ContaboInstance) => (
                  <TableRow key={instance.instanceId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Server className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {instance.displayName || instance.instanceName || instance.name || 'Sin nombre'}
                          </p>
                          <p className="text-xs text-text-secondary font-mono">
                            {instance.instanceId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(instance.status)}`} />
                        <span className="text-sm capitalize">{instance.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div className="flex items-center gap-1">
                          <Cpu className="h-3 w-3 text-text-secondary" />
                          <span className="text-white">{getCpu(instance)} vCPUs</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <MemoryStick className="h-3 w-3 text-text-secondary" />
                          <span className="text-text-secondary">{getRam(instance)} GB RAM</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <HardDrive className="h-3 w-3 text-text-secondary" />
                          <span className="text-text-secondary">{getDisk(instance)} GB</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-text-secondary font-mono">
                        <Globe className="h-3 w-3" />
                        <span>{getIp(instance)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-text-secondary">
                        <span>{instance.dataCenter || instance.region || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-secondary">
                        {getProductName(instance)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-text-secondary">
                        {getOsType(instance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
                        Disponible
                      </span>
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
