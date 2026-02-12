'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/axios'
import { useToast } from './use-toast'
import type { PaginationParams, AdminMetrics, VPSInstance } from '@/types'

export function useAdminMetrics(): {
  data: AdminMetrics | undefined
  isLoading: boolean
  error: unknown
} {
  const query = useQuery<AdminMetrics>({
    queryKey: ['admin', 'metrics'],
    queryFn: () => adminApi.metrics(),
    staleTime: 60000, // 1 minute
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}

export function useAdminAnalytics(period: '7d' | '30d' | '90d' | '1y' | 'all' = '30d') {
  return useQuery({
    queryKey: ['admin', 'analytics', period],
    queryFn: () => adminApi.analytics(period === '7d' ? 'week' : period === '30d' ? 'month' : period === '90d' ? 'month' : 'year'),
    staleTime: 60000,
  })
}

export function useAdminOrders(params?: PaginationParams) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => adminApi.orders.list(params),
    staleTime: 30000,
  })

  const orders = query.data?.data ?? []
  const total = query.data?.total ?? 0

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
  }

  return {
    orders,
    total,
    isLoading: query.isLoading,
    error: query.error,
    invalidate,
  }
}

export function useAdminOrder(id: string) {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const query = useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: () => adminApi.orders.byId(id),
    enabled: !!id,
  })

  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string } & Record<string, unknown>) =>
      adminApi.orders.updateStatus(id, data.status, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', id] })
      success('Estado de orden actualizado')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al actualizar estado', 'Error')
    },
  })

  const assignMutation = useMutation({
    mutationFn: (data: {
      contaboInstanceId: string
      ipAddress: string
      rootPassword: string
      region: string
      notes?: string
    }) => adminApi.orders.assign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', id] })
      success('VPS asignado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al asignar VPS', 'Error')
    },
  })

  const provisionMutation = useMutation({
    mutationFn: (data: {
      contaboInstanceId: string
      ipAddress: string
      rootPassword: string
      region: string
      notes?: string
    }) => adminApi.orders.provision(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', id] })
      success('VPS provisionado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al provisionar VPS', 'Error')
    },
  })

  return {
    order: query.data,
    isLoading: query.isLoading,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    assignVps: assignMutation.mutate,
    isAssigning: assignMutation.isPending,
    provisionVps: provisionMutation.mutate,
    isProvisioning: provisionMutation.isPending,
  }
}

export function useAdminProducts() {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const query = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => adminApi.products.list(),
    staleTime: 60000,
  })

  const createMutation = useMutation({
    mutationFn: adminApi.products.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      success('Producto creado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al crear producto', 'Error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.products.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      success('Producto actualizado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al actualizar producto', 'Error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.products.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      success('Producto eliminado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al eliminar producto', 'Error')
    },
  })

  const syncMutation = useMutation({
    mutationFn: adminApi.products.sync,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      success(`Sincronización completada: ${data.created} creados, ${data.updated} actualizados, ${data.failed} fallidos`)
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al sincronizar productos', 'Error')
    },
  })

  const toggleHomeMutation = useMutation({
    mutationFn: ({ id, showOnHome }: { id: string; showOnHome: boolean }) =>
      adminApi.products.update(id, { showOnHome }),
    onMutate: ({ id, showOnHome }) => {
      // Optimistic update
      queryClient.setQueryData(['admin', 'products'], (old: any[]) =>
        old?.map(p => p.id === id ? { ...p, showOnHome } : p) ?? []
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      toastError(getErrorMessage(err) || 'Error al actualizar producto', 'Error')
    },
  })

  const toggleRecommendedMutation = useMutation({
    mutationFn: ({ id, isRecommended }: { id: string; isRecommended: boolean }) =>
      adminApi.products.update(id, { isRecommended }),
    onMutate: ({ id, isRecommended }) => {
      // Optimistic update
      queryClient.setQueryData(['admin', 'products'], (old: any[]) =>
        old?.map(p => p.id === id ? { ...p, isRecommended } : p) ?? []
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      toastError(getErrorMessage(err) || 'Error al actualizar producto', 'Error')
    },
  })

  const updateHomeOrderMutation = useMutation({
    mutationFn: ({ id, homeOrder }: { id: string; homeOrder: number }) =>
      adminApi.products.update(id, { homeOrder }),
    onMutate: ({ id, homeOrder }) => {
      // Optimistic update
      queryClient.setQueryData(['admin', 'products'], (old: any[]) =>
        old?.map(p => p.id === id ? { ...p, homeOrder } : p) ?? []
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      toastError(getErrorMessage(err) || 'Error al actualizar orden', 'Error')
    },
  })

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    createProduct: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateProduct: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteProduct: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    syncProducts: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    toggleHomeProduct: toggleHomeMutation.mutate,
    toggleRecommendedProduct: toggleRecommendedMutation.mutate,
    updateHomeOrder: updateHomeOrderMutation.mutate,
  }
}

export function useAdminClients(params?: PaginationParams) {
  const queryClient = useQueryClient()

  // Define the response type properly
  type UsersResponse = {
    data: any[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }

  const query = useQuery<UsersResponse>({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.users.list(params) as Promise<UsersResponse>,
    staleTime: 60000,
  })

  const users = query.data?.data ?? []
  const pagination = query.data?.pagination

  return {
    users,
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    pagination,
  }
}

export function useAdminAllVps(params?: PaginationParams) {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const query = useQuery<VPSInstance[]>({
    queryKey: ['admin', 'vps', params],
    queryFn: async () => {
      const res = await adminApi.vps.list(params)
      return Array.isArray(res) ? res : (res as { data?: VPSInstance[] }).data ?? []
    },
    staleTime: 30000,
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.vps.suspend(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vps'] })
      success('VPS suspendido correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al suspender VPS', 'Error')
    },
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.vps.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'vps'] })
      success('VPS activado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al activar VPS', 'Error')
    },
  })

  // Backend returns array directly, not paginated
  const vpsList = query.data ?? []
  const total = vpsList.length

  return {
    vpsList,
    total,
    isLoading: query.isLoading,
    suspendVps: suspendMutation.mutate,
    activateVps: activateMutation.mutate,
  }
}

export function useAdminContaboAvailable() {
  const query = useQuery({
    queryKey: ['admin', 'contabo', 'available'],
    queryFn: () => adminApi.contaboInstancesAvailable(),
    staleTime: 60000, // 1 minute - Contabo data doesn't change that often
  })

  return {
    instances: query.data ?? [],
    count: query.data?.length ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminTickets(params?: PaginationParams) {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const query = useQuery({
    queryKey: ['admin', 'tickets', params],
    queryFn: () => adminApi.tickets.list(params),
    staleTime: 30000,
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      adminApi.tickets.reply(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] })
      success('Respuesta enviada')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al enviar respuesta', 'Error')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, priority }: { id: string; status: string; priority?: string }) =>
      adminApi.tickets.update(id, { status, priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] })
      success('Estado actualizado')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al actualizar estado', 'Error')
    },
  })

  return {
    tickets: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    reply: replyMutation.mutate,
    isReplying: replyMutation.isPending,
    updateStatus: updateStatusMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
  }
}

export function useAdminRegions() {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const query = useQuery({
    queryKey: ['admin', 'regions'],
    queryFn: () => adminApi.regions.list(),
    staleTime: 60000,
  })

  const createMutation = useMutation({
    mutationFn: adminApi.regions.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'regions'] })
      success('Región creada correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al crear región', 'Error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.regions.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'regions'] })
      success('Región actualizada correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al actualizar región', 'Error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.regions.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'regions'] })
      success('Región eliminada correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al eliminar región', 'Error')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: adminApi.regions.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'regions'] })
      success('Estado de región actualizado')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al actualizar estado', 'Error')
    },
  })

  const syncMutation = useMutation({
    mutationFn: adminApi.regions.sync,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'regions'] })
      success(`Sincronización completada: ${data.created} creadas, ${data.updated} actualizadas, ${data.failed} fallidas`)
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al sincronizar regiones', 'Error')
    },
  })

  return {
    regions: query.data ?? [],
    isLoading: query.isLoading,
    createRegion: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateRegion: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteRegion: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    toggleRegion: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    syncRegions: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  }
}

export function useAdminOperatingSystems() {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const query = useQuery({
    queryKey: ['admin', 'operatingSystems'],
    queryFn: () => adminApi.operatingSystems.list(),
    staleTime: 60000,
  })

  const createMutation = useMutation({
    mutationFn: adminApi.operatingSystems.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'operatingSystems'] })
      success('Sistema operativo creado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al crear sistema operativo', 'Error')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      adminApi.operatingSystems.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'operatingSystems'] })
      success('Sistema operativo actualizado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al actualizar sistema operativo', 'Error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: adminApi.operatingSystems.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'operatingSystems'] })
      success('Sistema operativo eliminado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al eliminar sistema operativo', 'Error')
    },
  })

  const updatePriceMutation = useMutation({
    mutationFn: ({ id, priceAdjustment }: { id: string; priceAdjustment: number }) =>
      adminApi.operatingSystems.updatePrice(id, priceAdjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'operatingSystems'] })
      success('Precio actualizado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al actualizar precio', 'Error')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: adminApi.operatingSystems.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'operatingSystems'] })
      success('Estado de sistema operativo actualizado')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al actualizar estado', 'Error')
    },
  })

  const syncMutation = useMutation({
    mutationFn: adminApi.operatingSystems.sync,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'operatingSystems'] })
      success(`Sincronización completada: ${data.created} creados, ${data.updated} actualizados, ${data.failed} fallidos`)
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al sincronizar sistemas operativos', 'Error')
    },
  })

  return {
    operatingSystems: query.data ?? [],
    isLoading: query.isLoading,
    createOperatingSystem: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateOperatingSystem: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteOperatingSystem: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    updatePrice: updatePriceMutation.mutate,
    isUpdatingPrice: updatePriceMutation.isPending,
    toggleOperatingSystem: toggleMutation.mutate,
    isToggling: toggleMutation.isPending,
    syncOperatingSystems: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  }
}
