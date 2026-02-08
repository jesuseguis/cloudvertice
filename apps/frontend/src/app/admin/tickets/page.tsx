'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAdminTickets } from '@/lib/hooks/use-admin'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
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
  MessageSquare,
  ChevronRight,
  Calendar,
} from 'lucide-react'
import type { TicketStatus, TicketPriority } from '@/types'

export default function AdminTicketsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tickets, total, isLoading } = useAdminTickets()

  // Initialize filters from URL params
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return searchParams.get('status') || 'all'
  })
  const [priorityFilter, setPriorityFilter] = useState<string>(() => {
    return searchParams.get('priority') || 'all'
  })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (priorityFilter !== 'all') params.set('priority', priorityFilter)

    const newUrl = params.toString() ? `/admin/tickets?${params.toString()}` : '/admin/tickets'
    router.replace(newUrl)
  }, [statusFilter, priorityFilter, router])

  const filteredTickets = tickets.filter((ticket) => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    return matchesStatus && matchesPriority
  })

  const getStatusLabel = (status: TicketStatus) => {
    const labels: Record<TicketStatus, string> = {
      open: 'Abierto',
      pending: 'Pendiente',
      resolved: 'Resuelto',
      closed: 'Cerrado',
    }
    return labels[status]
  }

  const getPriorityLabel = (priority: TicketPriority) => {
    const labels: Record<TicketPriority, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    }
    return labels[priority]
  }

  const getPriorityVariant = (priority: TicketPriority) => {
    const variants = {
      low: 'secondary' as const,
      medium: 'info' as const,
      high: 'warning' as const,
      urgent: 'danger' as const,
    }
    return variants[priority]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header title="Tickets de Soporte" subtitle={`Total: ${total} tickets`} />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abiertos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="resolved">Resueltos</SelectItem>
              <SelectItem value="closed">Cerrados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets Table */}
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
        ) : filteredTickets.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-12 w-12 text-text-secondary mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No hay tickets
              </h3>
              <p className="text-sm text-text-secondary">
                {statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Intenta con otros filtros'
                  : 'Los tickets aparecerán aquí cuando los clientes los creen'}
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Actualizado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-white/5"
                    onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{ticket.subject}</p>
                          <p className="text-xs text-text-secondary">
                            {ticket.messages.length} mensajes
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{ticket.userId.slice(0, 8)}...</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">
                        {ticket.category === 'technical' && 'Técnico'}
                        {ticket.category === 'billing' && 'Facturación'}
                        {ticket.category === 'general' && 'General'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold
                        ${ticket.priority === 'low' ? 'bg-card-dark border border-border-dark text-text-secondary' : ''}
                        ${ticket.priority === 'medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : ''}
                        ${ticket.priority === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}
                        ${ticket.priority === 'urgent' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
                      `}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Calendar className="h-4 w-4" />
                        {formatDate(ticket.updatedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
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
