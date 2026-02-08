// Authentication and user types

export type UserRole = 'client' | 'admin'

export interface User {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  name: string // Computed from firstName + lastName
  role: UserRole
  emailVerified: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn?: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Admin view of a user with additional metrics
export interface AdminUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: 'CUSTOMER' | 'ADMIN'
  emailVerified: boolean
  phone: string | null
  createdAt: string
  lastLogin: string | null
  metrics?: {
    activeVps: number
    totalOrders: number
    totalSpent: number
  }
  _count?: {
    vpsInstances: number
    orders: number
  }
}
