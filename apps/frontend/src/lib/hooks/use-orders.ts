'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, invoicesApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/axios'
import { useToast } from './use-toast'
import type { PaginationParams, CreateOrderRequest } from '@/types'

export function useClientOrders(params?: PaginationParams) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['client', 'orders', params],
    queryFn: () => ordersApi.list(params),
    staleTime: 30000,
  })

  const orders = query.data?.data ?? []
  const total = query.data?.total ?? 0

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['client', 'orders'] })
  }

  return {
    orders,
    total,
    isLoading: query.isLoading,
    error: query.error,
    invalidate,
  }
}

export function useClientOrder(id: string) {
  const query = useQuery({
    queryKey: ['client', 'orders', id],
    queryFn: () => ordersApi.byId(id),
    enabled: !!id,
  })

  return {
    order: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  return useMutation({
    mutationFn: (data: CreateOrderRequest) => ordersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'orders'] })
      success('Orden creada correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al crear orden', 'Error')
    },
  })
}

export function useClientInvoices(params?: PaginationParams) {
  return useQuery({
    queryKey: ['client', 'invoices', params],
    queryFn: () => invoicesApi.list(params),
    staleTime: 60000,
  })
}

export function useClientInvoice(id: string) {
  return useQuery({
    queryKey: ['client', 'invoices', id],
    queryFn: () => invoicesApi.byId(id),
    enabled: !!id,
  })
}
