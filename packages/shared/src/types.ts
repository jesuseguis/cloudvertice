// Shared types for Cloud Vertice

export interface User {
  id: string
  email: string
  name: string
  role: 'client' | 'admin'
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
