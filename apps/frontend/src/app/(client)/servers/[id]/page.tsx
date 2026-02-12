'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useVpsInstance, useVpsActions, useVpsSnapshots } from '@/lib/hooks/use-vps'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Globe,
  Calendar,
  Power,
  RefreshCw,
  PowerOff,
  Camera,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react'
import { createSnapshotSchema, type CreateSnapshotFormData } from '@/lib/validators'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUIStore } from '@/lib/stores/ui-store'

export default function VpsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vpsId = params.id as string
  const { vps, isLoading } = useVpsInstance(vpsId)
  const { executeAction } = useVpsActions(vpsId)
  const { snapshots, createSnapshot, restoreSnapshot, deleteSnapshot, syncSnapshots, isCreating, isSyncing } = useVpsSnapshots(vpsId)
  const { createSnapshotOpen, selectedVpsId, openCreateSnapshot, closeCreateSnapshot } = useUIStore()
  const [showPassword, setShowPassword] = useState(false)
  const [copiedIp, setCopiedIp] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateSnapshotFormData>({
    resolver: zodResolver(createSnapshotSchema),
  })

  useEffect(() => {
    if (createSnapshotOpen && selectedVpsId === vpsId) {
      reset()
    }
  }, [createSnapshotOpen, selectedVpsId, vpsId, reset])

  const handleAction = async (action: 'start' | 'stop' | 'restart' | 'shutdown') => {
    await executeAction(action)
  }

  const handleCopyIp = () => {
    if (vps && vps.ipAddress) {
      navigator.clipboard.writeText(vps.ipAddress)
      setCopiedIp(true)
      setTimeout(() => setCopiedIp(false), 2000)
    }
  }

  const onCreateSnapshot = async (data: CreateSnapshotFormData) => {
    await createSnapshot(data)
    closeCreateSnapshot()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <Server className="h-12 w-12 text-text-secondary animate-pulse mx-auto mb-4" />
          <p className="text-text-secondary">Cargando servidor...</p>
        </div>
      </div>
    )
  }

  if (!vps) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Server className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Servidor no encontrado</h3>
            <p className="text-text-secondary mb-4">El servidor que buscas no existe o no tienes acceso.</p>
            <Button onClick={() => router.push('/servers')}>Volver a mis servidores</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header title={vps.name} subtitle={`IP: ${vps.ipAddress}`} />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Quick Actions */}
        <div className="flex gap-3">
          {vps.status === 'RUNNING' ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleAction('restart')}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reiniciar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('shutdown')}
                className="flex-1 sm:flex-none text-amber-400 hover:text-amber-400"
              >
                <PowerOff className="mr-2 h-4 w-4" />
                Apagar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('stop')}
                className="flex-1 sm:flex-none text-red-400 hover:text-red-400"
              >
                <Power className="mr-2 h-4 w-4" />
                Forzar apagado
              </Button>
            </>
          ) : vps.status === 'STOPPED' ? (
            <Button onClick={() => handleAction('start')} className="flex-1 sm:flex-none">
              <Power className="mr-2 h-4 w-4" />
              Iniciar servidor
            </Button>
          ) : (
            <Button disabled className="flex-1 sm:flex-none">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card-dark/50 border border-border-dark">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="snapshots">
              Snapshots ({snapshots.length})
            </TabsTrigger>
            <TabsTrigger value="network">Red</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Estado del Servidor</span>
                  <StatusBadge status={vps.status} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background-dark rounded-lg p-4">
                    <Cpu className="h-5 w-5 text-text-secondary mb-2" />
                    <p className="text-2xl font-bold text-white">{vps.specs?.cpuCores}</p>
                    <p className="text-xs text-text-secondary">vCPUs</p>
                  </div>
                  <div className="bg-background-dark rounded-lg p-4">
                    <MemoryStick className="h-5 w-5 text-text-secondary mb-2" />
                    <p className="text-2xl font-bold text-white">{vps.specs?.ramGB}GB</p>
                    <p className="text-xs text-text-secondary">Memoria RAM</p>
                  </div>
                  <div className="bg-background-dark rounded-lg p-4">
                    <HardDrive className="h-5 w-5 text-text-secondary mb-2" />
                    <p className="text-2xl font-bold text-white">{vps.specs?.diskGB}GB</p>
                    <p className="text-xs text-text-secondary">{vps.specs?.diskType}</p>
                  </div>
                  <div className="bg-background-dark rounded-lg p-4">
                    <Globe className="h-5 w-5 text-text-secondary mb-2" />
                    <p className="text-2xl font-bold text-white">{vps.region}</p>
                    <p className="text-xs text-text-secondary">Región</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credentials Card */}
            <Card>
              <CardHeader>
                <CardTitle>Credenciales de Acceso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-text-secondary text-xs mb-1.5 block">Dirección IP</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-background-dark border border-border-dark rounded-md px-3 py-2 text-white font-mono text-sm">
                      {vps.ipAddress}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyIp}
                    >
                      {copiedIp ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-text-secondary text-xs mb-1.5 block">Usuario</Label>
                  <div className="bg-background-dark border border-border-dark rounded-md px-3 py-2 text-white font-mono text-sm">
                    root
                  </div>
                </div>
                {vps.rootPassword && (
                  <div>
                    <Label className="text-text-secondary text-xs mb-1.5 block">Contraseña Root</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-background-dark border border-border-dark rounded-md px-3 py-2 text-white font-mono text-sm">
                        {showPassword ? vps.rootPassword : '••••••••••••'}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                      Guarda esta contraseña de forma segura. No se mostrará nuevamente.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Servidor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">ID de instancia</span>
                  <span className="text-white font-mono">{vps.contaboInstanceId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Imagen</span>
                  <span className="text-white">{vps.image?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Fecha de creación</span>
                  <span className="text-white">
                    {new Date(vps.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {vps.nextBillingDate && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Próximo cobro</span>
                    <span className="text-white">
                      {new Date(vps.nextBillingDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Snapshots Tab */}
          <TabsContent value="snapshots" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Snapshots</h3>
                <p className="text-sm text-text-secondary">
                  Snapshots del servidor ({snapshots.length})
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => syncSnapshots()}
                  disabled={isSyncing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>
                <Dialog open={createSnapshotOpen && selectedVpsId === vpsId} onOpenChange={(open) => open ? openCreateSnapshot(vpsId) : closeCreateSnapshot()}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openCreateSnapshot(vpsId)}>
                      <Camera className="mr-2 h-4 w-4" />
                      Crear Snapshot
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Snapshot</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onCreateSnapshot)} className="space-y-4">
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          placeholder="Nombre del snapshot"
                          {...register('name')}
                          error={errors.name?.message}
                        />
                      </div>
                      <div>
                        <Label>Descripción (opcional)</Label>
                        <Input
                          placeholder="Descripción del snapshot"
                          {...register('description')}
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeCreateSnapshot}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                          {isCreating ? 'Creando...' : 'Crear'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {snapshots.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Camera className="h-12 w-12 text-text-secondary mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    No hay snapshots
                  </h3>
                  <p className="text-sm text-text-secondary text-center mb-6">
                    Crea tu primer snapshot para guardar el estado actual del servidor
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {snapshots.map((snapshot) => (
                  <Card key={snapshot.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-medium text-white">{snapshot.name}</h4>
                          {snapshot.description && (
                            <p className="text-sm text-text-secondary mt-1">
                              {snapshot.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-secondary mb-4">
                        <span>{snapshot.sizeMb ? `${snapshot.sizeMb} MB` : 'N/A'}</span>
                        <span>
                          {new Date(snapshot.createdAt).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => restoreSnapshot(snapshot.id)}
                        >
                          Restaurar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 hover:text-red-400"
                          onClick={() => deleteSnapshot(snapshot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Red</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Dirección IP Pública</Label>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 bg-background-dark border border-border-dark rounded-md px-3 py-2 text-white font-mono text-sm">
                      {vps.ipAddress}
                    </div>
                    <Button variant="outline" size="icon" onClick={handleCopyIp}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Puertos Disponibles</Label>
                  <p className="text-sm text-text-secondary mt-2">
                    Todos los puertos están disponibles por defecto. Asegúrate de configurar el firewall correctamente en tu servidor.
                  </p>
                </div>
                <div>
                  <Label>Región / Datacenter</Label>
                  <div className="bg-background-dark border border-border-dark rounded-md px-3 py-2 text-white mt-2">
                    {vps.region}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Servidor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Nombre del Servidor</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={vps.name} disabled />
                    <Button variant="outline">
                      Editar
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Input
                    value={vps.description || ''}
                    placeholder="Sin descripción"
                    disabled
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/30">
              <CardHeader>
                <CardTitle className="text-red-400">Zona de Peligro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary mb-4">
                  Una vez eliminado el servidor, no hay forma de recuperar los datos.
                </p>
                <Button variant="danger" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Servidor
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
