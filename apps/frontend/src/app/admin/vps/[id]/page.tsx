'use client'

import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Server,
  RefreshCw,
  Calendar,
  MapPin,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  User,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { useToast } from '@/lib/hooks/use-toast'
import type { VPSInstance } from '@/types'
import type { VPSStatus } from '@/types'

export default function AdminVpsDetailPage() {
  const router = useRouter()
  const params = useParams()
  const vpsId = params.id as string
  const { success, error: toastError } = useToast()

  const { data: vps, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'vps', vpsId],
    queryFn: () => adminApi.vps.byId(vpsId),
    enabled: !!vpsId,
  })

  const syncMutation = useMutation({
    mutationFn: () => adminApi.vps.sync(vpsId),
    onSuccess: () => {
      refetch()
      success('VPS sincronizado correctamente')
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : 'Error al sincronizar VPS', 'Error')
    },
  })

  const suspendMutation = useMutation({
    mutationFn: () => adminApi.vps.suspend(vpsId),
    onSuccess: () => {
      refetch()
      success('VPS suspendido correctamente')
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : 'Error al suspender VPS', 'Error')
    },
  })

  const activateMutation = useMutation({
    mutationFn: () => adminApi.vps.activate(vpsId),
    onSuccess: () => {
      refetch()
      success('VPS activado correctamente')
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : 'Error al activar VPS', 'Error')
    },
  })

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSpecs = () => {
    if (!vps?.product) return null
    return {
      cpu: vps.product.cpuCores,
      ram: `${Math.round(vps.product.ramMb / 1024)}GB`,
      disk: `${vps.product.diskGb}GB ${vps.product.diskType}`,
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header title="Detalles del VPS" />
        <div className="p-6 lg:p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (error || !vps) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header
          title="VPS No Encontrado"
          actions={
            <Button variant="ghost" onClick={() => router.push('/admin/vps')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a VPS
            </Button>
          }
        />
        <div className="p-6 lg:p-8">
          <Card className="p-8 text-center">
            <p className="text-text-secondary">El VPS no existe o no se pudo cargar.</p>
          </Card>
        </div>
      </div>
    )
  }

  const specs = getSpecs()
  const isRunning = vps.status === 'RUNNING'
  const isStopped = vps.status === 'STOPPED'
  const isSuspended = vps.status === 'SUSPENDED'

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title={vps.displayName || vps.name}
        subtitle={`ID: ${vps.contaboInstanceId || 'Sin asignar'}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
            <Button variant="ghost" onClick={() => router.push('/admin/vps')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Status Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <Server className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{vps.displayName || vps.name}</h2>
                <p className="text-sm text-text-secondary">{vps.contaboInstanceId || 'Sin asignar'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={vps.status.toLowerCase()} />
            </div>
          </div>

          {/* Specs Grid */}
          {specs && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center gap-3 p-3 bg-background-dark rounded-lg">
                <Cpu className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-secondary">CPU</p>
                  <p className="text-sm font-medium text-white">{specs.cpu} vCPU</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-background-dark rounded-lg">
                <MemoryStick className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-secondary">RAM</p>
                  <p className="text-sm font-medium text-white">{specs.ram}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-background-dark rounded-lg">
                <HardDrive className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-secondary">Disco</p>
                  <p className="text-sm font-medium text-white">{specs.disk}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-background-dark rounded-lg">
                <MapPin className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-xs text-text-secondary">Región</p>
                  <p className="text-sm font-medium text-white">{vps.region || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Network */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div>
              <Label className="text-text-secondary text-sm">Dirección IP</Label>
              <div className="flex items-center gap-2 mt-1">
                <Globe className="h-4 w-4 text-text-secondary" />
                <code className="text-white">{vps.ipAddress || 'Sin asignar'}</code>
              </div>
            </div>

            <div>
              <Label className="text-text-secondary text-sm">Máscara de Red</Label>
              <p className="mt-1 text-white">
                {vps.netmaskCidr ? `/${vps.netmaskCidr}` : '-'}
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <Label className="text-text-secondary text-sm">Creado</Label>
              <div className="flex items-center gap-2 mt-1 text-white">
                <Calendar className="h-4 w-4 text-text-secondary" />
                <span>{formatDate(vps.createdAt)}</span>
              </div>
            </div>

            <div>
              <Label className="text-text-secondary text-sm">Expira</Label>
              <div className="flex items-center gap-2 mt-1 text-white">
                <Calendar className="h-4 w-4 text-text-secondary" />
                <span>{formatDate(vps.expiresAt)}</span>
              </div>
            </div>

            {vps.suspendedAt && (
              <div>
                <Label className="text-text-secondary text-sm">Suspendido</Label>
                <div className="flex items-center gap-2 mt-1 text-white">
                  <Calendar className="h-4 w-4 text-text-secondary" />
                  <span>{formatDate(vps.suspendedAt)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Suspension Info */}
          {isSuspended && vps.suspensionReason && (
            <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-sm text-amber-400">
                <strong>Motivo:</strong> {vps.suspensionReason}
              </p>
            </div>
          )}
        </Card>

        {/* Actions Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Acciones</h3>
          <div className="flex flex-wrap gap-3">
            {isSuspended || vps.status === 'EXPIRED' ? (
              <Button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
              >
                <Server className="mr-2 h-4 w-4" />
                {activateMutation.isPending ? 'Activando...' : 'Activar VPS'}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={() => suspendMutation.mutate()}
                disabled={suspendMutation.isPending}
              >
                {suspendMutation.isPending ? 'Suspendiendo...' : 'Suspender VPS'}
              </Button>
            )}
          </div>
        </Card>

        {/* Client Info */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Información del Cliente</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{vps.user?.email || 'Desconocido'}</p>
                <p className="text-xs text-text-secondary">
                  {vps.user?.firstName && vps.user?.lastName
                    ? `${vps.user.firstName} ${vps.user.lastName}`
                    : 'Cliente'}
                </p>
              </div>
            </div>
            <div className="text-sm text-text-secondary">
              <p><strong>ID de Usuario:</strong> {vps.userId}</p>
              <p><strong>ID de Orden:</strong> {vps.orderId || 'Sin asociar'}</p>
            </div>
          </div>
        </Card>

        {/* Product Info */}
        {vps.product && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Producto</h3>
            <div className="space-y-2">
              <p className="text-white font-medium">{vps.product.name}</p>
              {vps.product.description && (
                <p className="text-sm text-text-secondary">{vps.product.description}</p>
              )}
              <p className="text-sm text-text-secondary">
                ID de Contabo: {vps.product.contaboProductId}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
