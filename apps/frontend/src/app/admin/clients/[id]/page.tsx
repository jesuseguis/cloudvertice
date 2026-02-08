'use client'

import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Server,
  ShoppingCart,
  DollarSign,
  Phone,
  Ban,
  CheckCircle,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { useToast } from '@/lib/hooks/use-toast'

export default function AdminClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const { success, error: toastError } = useToast()

  const { data: client, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'users', clientId],
    queryFn: () => adminApi.users.byId(clientId),
    enabled: !!clientId,
  })

  // Mutation to suspend VPS
  const suspendVpsMutation = useMutation({
    mutationFn: (vpsId: string) => adminApi.vps.suspend(vpsId),
    onSuccess: () => {
      refetch()
      success('VPS suspendido correctamente - El cliente ya no tiene acceso')
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : 'Error al suspender VPS', 'Error')
    },
  })

  // Mutation to activate/restore VPS
  const activateVpsMutation = useMutation({
    mutationFn: (vpsId: string) => adminApi.vps.activate(vpsId),
    onSuccess: () => {
      refetch()
      success('VPS activado correctamente - El cliente recuperó el acceso')
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : 'Error al activar VPS', 'Error')
    },
  })

  // Mutation to update VPS status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.vps.updateSuspension(id, { status }),
    onSuccess: () => {
      refetch()
      success('Estado de VPS actualizado')
    },
    onError: (err) => {
      toastError(err instanceof Error ? err.message : 'Error al actualizar estado', 'Error')
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

  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined) return '-'
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  }

  const getUserName = (user: any) => {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    return name || user.email
  }

  const getInitials = (user: any) => {
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim()
    if (name) {
      return name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email.slice(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header
          title="Detalles del Cliente"
          actions={
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          }
        />
        <div className="p-6 lg:p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header
          title="Cliente No Encontrado"
          actions={
            <Button variant="ghost" onClick={() => router.push('/admin/clients')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Clientes
            </Button>
          }
        />
        <div className="p-6 lg:p-8">
          <Card className="p-8 text-center">
            <p className="text-text-secondary">El cliente no existe o no se pudo cargar.</p>
          </Card>
        </div>
      </div>
    )
  }

  const vpsList = client.vpsInstances || []
  const orders = client.orders || []
  const metrics = client.metrics || {}

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title="Detalles del Cliente"
        subtitle={getUserName(client)}
        actions={
          <Button variant="ghost" onClick={() => router.push('/admin/clients')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        }
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Client Info */}
        <Card className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-primary">
                {getInitials(client)}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white mb-1">
                {getUserName(client)}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-4">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </div>
                {client.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Registrado: {formatDate(client.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {client.role === 'CUSTOMER' ? (
                  <span className="text-xs text-text-secondary">Cliente</span>
                ) : (
                  <span className="text-xs text-primary">Administrador</span>
                )}
                {client.emailVerified ? (
                  <span className="text-xs text-emerald-400">Verificado ✓</span>
                ) : (
                  <span className="text-xs text-amber-400">No verificado</span>
                )}
                {client.lastLogin && (
                  <span className="text-xs text-text-secondary">
                    Último acceso: {formatDate(client.lastLogin)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">VPS Activos</p>
                <p className="text-2xl font-bold text-white mt-1">{metrics.activeVps || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Server className="h-5 w-5 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Órdenes</p>
                <p className="text-2xl font-bold text-white mt-1">{metrics.totalOrders || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Gastado</p>
                <p className="text-2xl font-bold text-white mt-1">{formatCurrency(metrics.totalSpent)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Rol</p>
                <p className="text-lg font-semibold text-white mt-1">
                  {client.role === 'CUSTOMER' ? 'Cliente' : 'Admin'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <User className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* VPS Instances */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Servidores VPS</h3>
          {vpsList.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-text-secondary">
                Este cliente no tiene servidores VPS activos
              </div>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servidor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Región</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead>Cambiar Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vpsList.map((vps: any) => {
                    const isSuspended = vps.status === 'SUSPENDED' || vps.status === 'EXPIRED'
                    return (
                      <TableRow key={vps.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-white">{vps.displayName || vps.name}</p>
                            <p className="text-xs text-text-secondary font-mono">
                              {vps.contaboInstanceId || 'Sin asignar'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={vps.status.toLowerCase()} />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{vps.region || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{vps.product?.name || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{formatDate(vps.createdAt)}</span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={vps.status}
                            onValueChange={(value) =>
                              updateStatusMutation.mutate({ id: vps.id, status: value })
                            }
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pendiente</SelectItem>
                              <SelectItem value="PROVISIONING">Provisionando</SelectItem>
                              <SelectItem value="RUNNING">Activo</SelectItem>
                              <SelectItem value="STOPPED">Detenido</SelectItem>
                              <SelectItem value="SUSPENDED">Suspendido</SelectItem>
                              <SelectItem value="EXPIRED">Expirado</SelectItem>
                              <SelectItem value="TERMINATED">Terminado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {isSuspended ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => activateVpsMutation.mutate(vps.id)}
                                disabled={activateVpsMutation.isPending}
                                className="text-emerald-400 hover:text-emerald-400"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Activar
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => suspendVpsMutation.mutate(vps.id)}
                                disabled={suspendVpsMutation.isPending}
                                className="text-red-400 hover:text-red-400"
                              >
                                <Ban className="h-4 w-4 mr-1" />
                                Bloquear
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>

        {/* Orders */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Órdenes Recientes</h3>
          {orders.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-text-secondary">
                Este cliente no tiene órdenes
              </div>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <code className="text-sm">{order.orderNumber}</code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{order.product?.name || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded ${
                          order.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : order.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-400'
                            : order.status === 'CANCELLED'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(order.createdAt)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
