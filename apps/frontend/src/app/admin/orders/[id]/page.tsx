'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAdminOrder, useAdminContaboAvailable } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Server,
  Check,
  X,
  AlertCircle,
  Calendar,
  User,
  Cpu,
  MemoryStick,
  HardDrive,
  Globe,
  FileText,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { provisionVpsSchema, type ProvisionVpsFormData } from '@/lib/validators'

interface ContaboInstance {
  instanceId: string | number
  displayName?: string
  name?: string
  cpuCores: number
  ramMb: number
  diskMb: number
  ipConfig?: {
    v4?: { ip?: string }
  }
  dataCenter?: string
  region?: string
  productName?: string
  osType?: string
  status: string
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const { order, isLoading, updateStatus, isUpdating, provisionVps, isProvisioning, generateInvoice, isGeneratingInvoice } = useAdminOrder(orderId)
  const { instances: availableInstances, isLoading: isLoadingInstances } = useAdminContaboAvailable()
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<ProvisionVpsFormData>({
    resolver: zodResolver(provisionVpsSchema),
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: order?.currency || 'USD',
    }).format(amount)
  }

  const handleStatusUpdate = async (status: string) => {
    await updateStatus({ status })
  }

  const handleInstanceSelect = (instanceId: string) => {
    setSelectedInstanceId(instanceId)
    const selectedInstance = availableInstances.find((i: ContaboInstance) => i.instanceId.toString() === instanceId)
    if (selectedInstance) {
      // Auto-fill form fields with options to force re-render
      setValue('contaboInstanceId', selectedInstance.instanceId.toString(), { shouldValidate: true, shouldDirty: true })
      setValue('ipAddress', selectedInstance.ipConfig?.v4?.ip || '', { shouldValidate: true, shouldDirty: true })
      setValue('region', selectedInstance.dataCenter || selectedInstance.region || '', { shouldValidate: true, shouldDirty: true })
    }
  }

  const handleProvision = async (data: ProvisionVpsFormData) => {
    await provisionVps(data)
    setProvisionDialogOpen(false)
    setSelectedInstanceId(null)
    reset()
  }

  const handleDialogClose = () => {
    setProvisionDialogOpen(false)
    setSelectedInstanceId(null)
    reset()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Cargando orden...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Orden no encontrada</h3>
            <p className="text-text-secondary mb-4">La orden que buscas no existe.</p>
            <Button onClick={() => router.push('/admin/orders')}>Volver a órdenes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title={`Orden #${order.orderNumber}`}
        subtitle={<StatusBadge status={order.status} />}
      />

      <div className="p-6 lg:p-8 space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Producto Solicitado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Server className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">
                      {order.product?.name || 'Producto'}
                    </h4>
                    <p className="text-sm text-text-secondary mt-1">
                      {order.product?.cpuCores || '-'} vCPU • {order.product?.ramMb ? Math.round(order.product.ramMb / 1024) : '-'}GB RAM • {order.region || 'EU'}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      Período: {order.periodMonths} {order.periodMonths === 1 ? 'mes' : 'meses'}
                    </p>
                    {order.imageId && (
                      <p className="text-xs text-text-secondary mt-1">
                        ID de Imagen: {order.imageId}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{formatCurrency(order.totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Provisioning Actions */}
            {(order.status === 'PAID' || order.status === 'PROCESSING') && (
              <Card>
                <CardHeader>
                  <CardTitle>Provisionar VPS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleStatusUpdate('PROCESSING')}
                      disabled={isUpdating || order.status === 'PROCESSING'}
                    >
                      Marcar como Procesando
                    </Button>
                    <Dialog open={provisionDialogOpen} onOpenChange={setProvisionDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1">
                          <Server className="mr-2 h-4 w-4" />
                          Asignar VPS
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Asignar VPS a la Orden</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(handleProvision)} className="space-y-4">
                          {/* Instance Selector */}
                          <div>
                            <Label>Seleccionar Instancia Disponible</Label>
                            <Select
                              value={selectedInstanceId || ''}
                              onValueChange={handleInstanceSelect}
                              disabled={isLoadingInstances}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  isLoadingInstances
                                    ? 'Cargando instancias...'
                                    : availableInstances.length === 0
                                    ? 'No hay instancias disponibles'
                                    : 'Selecciona una instancia'
                                } />
                              </SelectTrigger>
                              <SelectContent>
                                {availableInstances.map((instance: ContaboInstance) => (
                                  <SelectItem key={instance.instanceId} value={instance.instanceId.toString()}>
                                    <div className="flex items-center gap-2 py-1">
                                      <div>
                                        <div className="font-medium">
                                          {instance.displayName || instance.name || `Instance ${instance.instanceId}`}
                                        </div>
                                        <div className="text-xs text-text-secondary flex items-center gap-2">
                                          <span className="flex items-center gap-1">
                                            <Cpu className="h-3 w-3" />
                                            {instance.cpuCores} vCPU
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <MemoryStick className="h-3 w-3" />
                                            {Math.round(instance.ramMb / 1024)} GB
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <HardDrive className="h-3 w-3" />
                                            {Math.round(instance.diskMb / 1024)} GB
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <Globe className="h-3 w-3" />
                                            {instance.ipConfig?.v4?.ip || 'N/A'}
                                          </span>
                                          <span>• {instance.productName || instance.osType}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Auto-filled fields (read-only when instance is selected) */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>ID de Instancia</Label>
                              <Input
                                placeholder="ej. 1234567"
                                {...register('contaboInstanceId')}
                                error={errors.contaboInstanceId?.message}
                                readOnly={!!selectedInstanceId}
                                className={selectedInstanceId ? 'bg-card-dark border-border-dark text-white cursor-not-allowed opacity-70' : ''}
                              />
                            </div>
                            <div>
                              <Label>Dirección IP</Label>
                              <Input
                                placeholder="192.168.1.1"
                                {...register('ipAddress')}
                                error={errors.ipAddress?.message}
                                readOnly={!!selectedInstanceId}
                                className={selectedInstanceId ? 'bg-card-dark border-border-dark text-white cursor-not-allowed opacity-70' : ''}
                              />
                            </div>
                          </div>

                          <div>
                            <Label>Región</Label>
                            <Input
                              placeholder="ej. EU-CENTRAL-1"
                              {...register('region')}
                              error={errors.region?.message}
                              readOnly={!!selectedInstanceId}
                              className={selectedInstanceId ? 'bg-card-dark border-border-dark text-white cursor-not-allowed opacity-70' : ''}
                            />
                          </div>

                          <Separator />

                          {/* Manual input fields */}
                          <div>
                            <Label>Contraseña Root *</Label>
                            <Input
                              type="password"
                              placeholder="Contraseña del VPS"
                              {...register('rootPassword')}
                              error={errors.rootPassword?.message}
                            />
                            <p className="text-xs text-text-secondary mt-1">
                              Esta contraseña será almacenada de forma segura y encriptada.
                            </p>
                          </div>

                          <div>
                            <Label>Notas (opcional)</Label>
                            <Textarea
                              placeholder="Notas adicionales sobre esta asignación..."
                              {...register('notes')}
                            />
                          </div>

                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleDialogClose}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={isProvisioning || !selectedInstanceId}>
                              {isProvisioning ? 'Asignando...' : 'Asignar VPS'}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assigned VPS Info */}
            {order.metadata?.vpsInstanceId && (
              <Card className="border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-emerald-500" />
                    VPS Asignado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">ID de Instancia</span>
                    <span className="text-white font-mono">{order.metadata.contaboInstanceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Dirección IP</span>
                    <span className="text-white font-mono">{order.metadata.ipAddress}</span>
                  </div>
                  {order.metadata.provisioningNotes && (
                    <div>
                      <span className="text-text-secondary block mb-1">Notas</span>
                      <p className="text-white text-xs bg-background-dark p-2 rounded">
                        {order.metadata.provisioningNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de la Orden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Estado Actual</Label>
                  <div className="mt-2">
                    <StatusBadge status={order.status} />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label>Cambiar Estado</Label>
                  <div className="mt-2 space-y-2">
                    {order.status === 'PAID' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleStatusUpdate('PROCESSING')}
                        disabled={isUpdating}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Procesando
                      </Button>
                    )}
                    {order.status === 'PROVISIONING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => handleStatusUpdate('COMPLETED')}
                        disabled={isUpdating}
                      >
                        <Check className="mr-2 h-4 w-4 text-emerald-500" />
                        Completado
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-red-400 hover:text-red-400"
                      onClick={() => handleStatusUpdate('CANCELLED')}
                      disabled={isUpdating}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between font-medium">
                  <span className="text-white">Total</span>
                  <span className="text-white text-lg">{formatCurrency(order.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Invoice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Factura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.invoice ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Número</span>
                      <span className="text-white font-mono">{order.invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Monto</span>
                      <span className="text-white">{formatCurrency(Number(order.invoice.total))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Estado</span>
                      <StatusBadge status={order.invoice.status} />
                    </div>
                  </>
                ) : ['PAID', 'PROCESSING', 'PROVISIONING', 'COMPLETED'].includes(order.status) ? (
                  <>
                    <p className="text-sm text-text-secondary">
                      No se ha generado factura para esta orden.
                    </p>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => generateInvoice()}
                      disabled={isGeneratingInvoice}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {isGeneratingInvoice ? 'Generando...' : 'Generar Factura'}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-text-secondary">
                    La factura se puede generar una vez la orden esté pagada.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-text-secondary">ID de Cliente</p>
                  <p className="text-white font-mono">{order.userId}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Fecha de creación</p>
                  <p className="text-white">{formatDate(order.createdAt)}</p>
                </div>
                {order.completedAt && (
                  <div>
                    <p className="text-text-secondary">Completado el</p>
                    <p className="text-white">{formatDate(order.completedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
