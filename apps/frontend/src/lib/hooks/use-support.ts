'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supportApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/api/axios'
import { useToast } from './use-toast'
import type { PaginationParams, CreateTicketRequest, SupportTicket } from '@/types'

export function useClientTickets(params?: PaginationParams) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['client', 'tickets', params],
    queryFn: () => supportApi.list(params),
    staleTime: 30000,
  })

  const tickets = query.data?.data ?? []
  const total = query.data?.total ?? 0

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['client', 'tickets'] })
  }

  return {
    tickets,
    total,
    isLoading: query.isLoading,
    error: query.error,
    invalidate,
  }
}

export function useClientTicket(id: string): {
  ticket: SupportTicket | undefined
  isLoading: boolean
  reply: (message: string) => void
  isReplying: boolean
} {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const query = useQuery({
    queryKey: ['client', 'tickets', id],
    queryFn: () => supportApi.byId(id),
    enabled: !!id,
  })

  const replyMutation = useMutation({
    mutationFn: (message: string) => supportApi.addMessage(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'tickets'] })
      queryClient.invalidateQueries({ queryKey: ['client', 'tickets', id] })
      success('Respuesta enviada')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al enviar respuesta', 'Error')
    },
  })

  return {
    ticket: query.data,
    isLoading: query.isLoading,
    reply: replyMutation.mutate,
    isReplying: replyMutation.isPending,
  }
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const mutation = useMutation({
    mutationFn: (data: CreateTicketRequest) => supportApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', 'tickets'] })
      success('Ticket creado correctamente')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al crear ticket', 'Error')
    },
  })

  return {
    createTicket: mutation.mutateAsync,
    isPending: mutation.isPending,
  }
}
