'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Send,
  User,
  MessageSquare,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getErrorMessage } from '@/lib/api/axios'
import { useToast } from '@/lib/hooks/use-toast'

export default function AdminTicketDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { success, error: toastError } = useToast()
  const queryClient = useQueryClient()

  const ticketId = params.id as string

  const [replyText, setReplyText] = useState('')

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['admin', 'tickets', ticketId],
    queryFn: () => adminApi.tickets.byId(ticketId),
    enabled: !!ticketId,
  })

  const replyMutation = useMutation({
    mutationFn: (message: string) =>
      adminApi.tickets.reply(ticketId, message),
    onSuccess: () => {
      setReplyText('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] })
      success('Respuesta enviada')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al enviar respuesta', 'Error')
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, priority }: { status?: string; priority?: string }) =>
      adminApi.tickets.update(ticketId, { status, priority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'tickets'] })
      success('Estado actualizado')
    },
    onError: (err) => {
      toastError(getErrorMessage(err) || 'Error al actualizar estado', 'Error')
    },
  })

  const handleSendReply = () => {
    if (!replyText.trim()) return
    replyMutation.mutate(replyText)
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Abierto',
      pending: 'Pendiente',
      resolved: 'Resuelto',
      closed: 'Cerrado',
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    }
    return labels[priority] || priority
  }

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      open: 'success',
      pending: 'warning',
      resolved: 'info',
      closed: 'secondary',
    }
    return variants[status] || 'secondary'
  }

  const getPriorityVariant = (priority: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      low: 'secondary',
      medium: 'info',
      high: 'warning',
      urgent: 'danger',
    }
    return variants[priority] || 'secondary'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      technical: 'Técnico',
      billing: 'Facturación',
      general: 'General',
    }
    return labels[category] || category
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header title="Cargando..." subtitle="" />
        <div className="p-6 lg:p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-card-dark/50 rounded w-64" />
            <div className="h-32 bg-card-dark/50 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background-dark">
        <Header title="Ticket no encontrado" subtitle="" />
        <div className="p-6 lg:p-8">
          <Button variant="outline" onClick={() => router.push('/admin/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a tickets
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title={`Ticket #${ticket.id.slice(0, 8)}`}
        subtitle={ticket.subject}
      />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Back button */}
        <Button variant="outline" onClick={() => router.push('/admin/tickets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a tickets
        </Button>

        {/* Ticket Info Card */}
        <Card className="bg-card-dark border-border-dark">
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">{ticket.subject}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={getStatusVariant(ticket.status)}>
                    {getStatusLabel(ticket.status)}
                  </Badge>
                  <Badge variant={getPriorityVariant(ticket.priority)}>
                    {getPriorityLabel(ticket.priority)}
                  </Badge>
                  {ticket.category && (
                    <Badge variant="outline">
                      {getCategoryLabel(ticket.category)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {ticket.user?.firstName} {ticket.user?.lastName}
                    </span>
                    <span className="text-text-secondary">({ticket.user?.email})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {new Date(ticket.createdAt).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Priority Controls */}
              <div className="flex items-center gap-3">
                <Select
                  value={ticket.status}
                  onValueChange={(value) =>
                    updateStatusMutation.mutate({ status: value })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={ticket.priority}
                  onValueChange={(value) =>
                    updateStatusMutation.mutate({ priority: value })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>

        {/* Messages */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Mensajes</h3>

          <div className="space-y-4">
            {ticket.messages?.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.isAdmin ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    message.isAdmin
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-card-dark border border-border-dark'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.isAdmin ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Admin</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm font-medium text-white">
                          {ticket.user?.firstName} {ticket.user?.lastName}
                        </span>
                      </>
                    )}
                    <span className="text-xs text-text-secondary">
                      {new Date(message.createdAt).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-white whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          {ticket.status !== 'closed' && (
            <Card className="bg-card-dark border-border-dark">
              <div className="p-4">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Escribe tu respuesta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="flex-1 bg-background-dark border-border-dark"
                  />
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSendReply}
                      disabled={!replyText.trim() || replyMutation.isPending}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
