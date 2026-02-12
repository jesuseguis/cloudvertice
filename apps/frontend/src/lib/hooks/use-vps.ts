'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { vpsApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/axios'
import { useVpsStore } from '@/lib/stores/vps-store'
import { useToast } from './use-toast'
import type { VPSAction, CreateSnapshotRequest, VPSInstance } from '@/types'

export function useVpsInstances(params?: { page?: number; limit?: number; search?: string }) {
  const queryClient = useQueryClient()

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vps', params],
    queryFn: () => vpsApi.list(params),
    staleTime: 30000, // 30 seconds
  })

  const vpsList = response?.data ?? []
  const total = response?.total ?? 0

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vps'] })
  }

  return {
    vpsList,
    total,
    isLoading,
    error,
    invalidate,
  }
}

export function useVpsInstance(id: string): {
  vps: VPSInstance | null
  isLoading: boolean
  isError: boolean
  refetch: () => void
} {
  const { setSelectedVps } = useVpsStore()

  const query = useQuery({
    queryKey: ['vps', id],
    queryFn: () => vpsApi.byId(id),
    enabled: !!id,
    staleTime: 15000, // 15 seconds
  })

  useEffect(() => {
    if (query.data) {
      setSelectedVps(query.data)
    }
  }, [query.data, setSelectedVps])

  const vps = query.data
  const isLoading = query.isLoading
  const isError = query.isError

  return {
    vps: vps ?? null,
    isLoading,
    isError,
    refetch: query.refetch,
  }
}

export function useVpsActions(id: string) {
  const queryClient = useQueryClient()
  const { updateVpsStatus } = useVpsStore()
  const { success, error: toastError } = useToast()

  const executeAction = async (action: VPSAction) => {
    try {
      let response
      switch (action) {
        case 'start':
          response = await vpsApi.start(id)
          break
        case 'stop':
          response = await vpsApi.stop(id)
          break
        case 'restart':
          response = await vpsApi.restart(id)
          break
        case 'shutdown':
          response = await vpsApi.shutdown(id)
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }

      if (response.status) {
        updateVpsStatus(id, response.status)
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['vps'] })
      queryClient.invalidateQueries({ queryKey: ['vps', id] })

      success(response.message, `${action.charAt(0).toUpperCase() + action.slice(1)} exitoso`)
      return true
    } catch (err) {
      toastError(getErrorMessage(err) || `Error al ejecutar ${action}`, 'Error')
      return false
    }
  }

  return {
    executeAction,
  }
}

export function useVpsSnapshots(id: string) {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const { data: snapshots, isLoading } = useQuery({
    queryKey: ['vps', id, 'snapshots'],
    queryFn: () => vpsApi.snapshots(id),
    enabled: !!id,
    staleTime: 30000,
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateSnapshotRequest) => vpsApi.createSnapshot(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps', id, 'snapshots'] })
      success('Snapshot creado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al crear snapshot', 'Error')
    },
  })

  const syncMutation = useMutation({
    mutationFn: () => vpsApi.syncSnapshots(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps', id, 'snapshots'] })
      success('Snapshots sincronizados desde Contabo')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al sincronizar snapshots', 'Error')
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (snapshotId: string) => vpsApi.restoreSnapshot(id, snapshotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps', id, 'snapshots'] })
      success('Snapshot restaurado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al restaurar snapshot', 'Error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (snapshotId: string) => vpsApi.deleteSnapshot(id, snapshotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps', id, 'snapshots'] })
      success('Snapshot eliminado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al eliminar snapshot', 'Error')
    },
  })

  return {
    snapshots: snapshots ?? [],
    isLoading,
    createSnapshot: createMutation.mutate,
    isCreating: createMutation.isPending,
    syncSnapshots: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    restoreSnapshot: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
    deleteSnapshot: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}

export function useVpsPasswordReset(id: string) {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const resetMutation = useMutation({
    mutationFn: (newPassword: string) => vpsApi.resetPassword(id, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps', id] })
      success('Contraseña reseteada correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al resetear contraseña', 'Error')
    },
  })

  return {
    resetPassword: resetMutation.mutate,
    isResetting: resetMutation.isPending,
  }
}

export function useVpsRescueMode(id: string) {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const enableMutation = useMutation({
    mutationFn: () => vpsApi.rescueMode(id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps', id] })
      success('Modo rescate activado')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al activar modo rescate', 'Error')
    },
  })

  const disableMutation = useMutation({
    mutationFn: () => vpsApi.rescueMode(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps', id] })
      success('Modo rescate desactivado')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al desactivar modo rescate', 'Error')
    },
  })

  return {
    enableRescueMode: enableMutation.mutate,
    isEnabling: enableMutation.isPending,
    disableRescueMode: disableMutation.mutate,
    isDisabling: disableMutation.isPending,
  }
}
