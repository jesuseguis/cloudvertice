// Support ticket types

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface SupportTicket {
  id: string
  userId: string
  orderId?: string
  vpsInstanceId?: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  category: 'technical' | 'billing' | 'general'
  messages: TicketMessage[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

export interface TicketMessage {
  id: string
  ticketId: string
  userId: string
  content: string
  isAdmin: boolean
  createdAt: string
  user?: {
    id: string
    email: string
    firstName?: string
    lastName?: string
    role?: string
  }
}

export interface CreateTicketRequest {
  subject: string
  category: 'technical' | 'billing' | 'general'
  orderId?: string
  vpsInstanceId?: string
  message: string
}

export interface TicketReplyRequest {
  message: string
  attachments?: string[]
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus
  priority?: TicketPriority
}
