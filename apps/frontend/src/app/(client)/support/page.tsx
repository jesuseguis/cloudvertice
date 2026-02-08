'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClientTickets, useCreateTicket } from '@/lib/hooks/use-support'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
  Plus,
  Clock,
  Calendar,
  Eye,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createTicketSchema, type CreateTicketFormData } from '@/lib/validators'
import type { TicketStatus } from '@/types'

export default function SupportPage() {
  const router = useRouter()
  const { tickets, isLoading } = useClientTickets()
  const { createTicket, isPending } = useCreateTicket()
  const [open, setOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
  })

  const filteredTickets = tickets.filter((ticket) => {
    return statusFilter === 'all' || ticket.status === statusFilter
  })

  const onSubmit = async (data: CreateTicketFormData) => {
    const success = await createTicket(data)
    if (success) {
      reset()
      setOpen(false)
    }
  }

  const getStatusLabel = (status: TicketStatus) => {
    const labels: Record<TicketStatus, string> = {
      open: 'Abierto',
      pending: 'Pendiente',
      resolved: 'Resuelto',
      closed: 'Cerrado',
    }
    return labels[status]
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
      <Header title="Soporte" subtitle="Gestiona tus tickets de soporte" />

      <div className="p-6 lg:p-8 space-y-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abiertos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="resolved">Resueltos</SelectItem>
              <SelectItem value="closed">Cerrados</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Ticket de Soporte</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Asunto</Label>
                  <Input
                    placeholder="Describe tu problema brevemente"
                    {...register('subject')}
                    error={errors.subject?.message}
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Select onValueChange={(value) => setValue('category', value as any)}>
                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="billing">Facturación</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>
                  )}
                </div>
                <div>
                  <Label>Mensaje</Label>
                  <Textarea
                    placeholder="Describe tu problema con el mayor detalle posible"
                    rows={5}
                    {...register('message')}
                    error={errors.message?.message}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false)
                      reset()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Enviando...' : 'Crear Ticket'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tickets Table */}
        {isLoading ? (
          <Card>
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-card-dark/50 rounded w-1/4 mx-auto mb-4" />
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
                {statusFilter !== 'all' ? 'No hay tickets con este estado' : 'No tienes tickets'}
              </h3>
              <p className="text-sm text-text-secondary text-center mb-6">
                {statusFilter !== 'all'
                  ? 'Intenta con otro filtro de estado'
                  : 'Crea un ticket de soporte si necesitas ayuda'}
              </p>
              {statusFilter === 'all' && (
                <Button onClick={() => setOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Ticket
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Categoría</TableHead>
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
                    onClick={() => router.push(`/support/tickets/${ticket.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{ticket.subject}</p>
                          <p className="text-xs text-text-secondary">
                            {ticket.messages.length} mensajes
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">
                        {ticket.category === 'technical' && 'Técnico'}
                        {ticket.category === 'billing' && 'Facturación'}
                        {ticket.category === 'general' && 'General'}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/support/tickets/${ticket.id}`)
                        }}
                      >
                        <Eye className="h-4 w-4" />
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
