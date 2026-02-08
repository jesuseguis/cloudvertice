import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginRequest, RegisterRequest } from '@/types'
import { authApi, getToken, setToken, setRefreshToken, clearTokens, setUserRole } from '@/lib/api'

interface AuthState {
  // State
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  setUser: (user: User | null) => void
  setTokens: (token: string, refreshToken: string) => void
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: getToken(),
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Setters
      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (token, refreshToken) => {
        setToken(token)
        setRefreshToken(refreshToken)
        set({ token, refreshToken })
      },

      // Login
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(credentials)
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          // Store tokens in localStorage and cookies
          setToken(response.token)
          setRefreshToken(response.refreshToken)
          // Store user role in cookies for middleware
          setUserRole(response.user.role)
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          })
          throw error
        }
      },

      // Register
      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(data)
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          setToken(response.token)
          setRefreshToken(response.refreshToken)
          // Store user role in cookies for middleware
          setUserRole(response.user.role)
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          })
          throw error
        }
      },

      // Logout
      logout: async () => {
        try {
          await authApi.logout()
        } catch (error) {
          // Ignore logout errors, just clear local state
          console.error('Logout error:', error)
        } finally {
          clearTokens()
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          })
        }
      },

      // Refresh user data
      refreshUser: async () => {
        const token = getToken()
        if (!token) return

        set({ isLoading: true })
        try {
          const user = await authApi.me()
          // Update role in cookie
          setUserRole(user.role)
          set({ user, isAuthenticated: true, isLoading: false })
        } catch (error) {
          // If refresh fails, clear auth state
          clearTokens()
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
