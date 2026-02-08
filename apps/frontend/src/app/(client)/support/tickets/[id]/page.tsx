'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useClientTicket } from '@/lib/hooks/use-support'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
  MessageSquare,
  User,
  Shield,
  ArrowLeft,
  Send,
  Clock,
} from 'lucide-react'

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const { ticket, isLoading, reply, isReplying } = useClientTicket(ticketId)
  const [message, setMessage] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    await reply(message)
    setMessage('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-text-secondary animate-pulse mx-auto mb-4" />
          <p className="text-text-secondary">Cargando ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <MessageSquare className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Ticket no encontrado</h3>
            <p className="text-text-secondary mb-4">El ticket que buscas no existe.</p>
            <Button onClick={() => router.push('/support')}>Volver a soporte</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <Header
        title={ticket.subject}
        subtitle={
          <div className="flex items-center gap-3">
            <StatusBadge status={ticket.status} />
            <span className="text-sm text-text-secondary capitalize">
              {ticket.category === 'technical' && 'Técnico'}
              {ticket.category === 'billing' && 'Facturación'}
              {ticket.category === 'general' && 'General'}
            </span>
          </div>
        }
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
          {/* Messages */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reply Form */}
            {ticket.status !== 'closed' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Responder</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitReply} className="space-y-4">
                    <div>
                      <Textarea
                        placeholder="Escribe tu respuesta..."
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={!message.trim() || isReplying}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {isReplying ? 'Enviando...' : 'Enviar respuesta'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Messages List */}
            <div className="space-y-4">
              {ticket.messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${msg.isAdmin ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.isAdmin
                        ? 'bg-primary/20 text-primary'
                        : 'bg-card-dark border border-border-dark text-text-secondary'
                    }`}>
                      {msg.isAdmin ? (
                        <Shield className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <Card className={msg.isAdmin ? 'bg-primary/10 border-primary/30' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white text-sm">
                            {msg.isAdmin ? 'Soporte' : (msg.user?.firstName ? `${msg.user.firstName} ${msg.user.lastName || ''}`.trim() : 'Tú')}
                          </span>
                          {msg.isAdmin && (
                            <StatusBadge status="info" variant="info">Staff</StatusBadge>
                          )}
                        </div>
                        <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-text-secondary">
                          <Clock className="h-3 w-3" />
                          {formatDate(msg.createdAt)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-text-secondary mb-1">Estado</p>
                  <StatusBadge status={ticket.status} />
                </div>
                <div>
                  <p className="text-text-secondary mb-1">Prioridad</p>
                  <p className="text-white capitalize">{ticket.priority}</p>
                </div>
                <div>
                  <p className="text-text-secondary mb-1">Categoría</p>
                  <p className="text-white capitalize">
                    {ticket.category === 'technical' && 'Técnico'}
                    {ticket.category === 'billing' && 'Facturación'}
                    {ticket.category === 'general' && 'General'}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-text-secondary mb-1">Creado</p>
                  <p className="text-white">{formatDate(ticket.createdAt)}</p>
                </div>
                <div>
                  <p className="text-text-secondary mb-1">Última actualización</p>
                  <p className="text-white">{formatDate(ticket.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Related VPS/Order */}
            {ticket.vpsInstanceId && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">VPS Relacionado</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/servers/${ticket.vpsInstanceId}`)}
                  >
                    Ver servidor
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
