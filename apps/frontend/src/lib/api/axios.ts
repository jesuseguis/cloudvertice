import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { API_ENDPOINTS } from './endpoints'
import type { ApiError, ErrorResponse } from '@/types'

// Token storage helpers (client-side only)
const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_ROLE_KEY = 'user_role'

// Helper to set cookie
const setCookie = (name: string, value: string, days: number = 7): void => {
  if (typeof window === 'undefined') return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

// Helper to get cookie
const getCookie = (name: string): string | null => {
  if (typeof window === 'undefined') return null
  const nameEQ = `${name}=`
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

// Helper to delete cookie
const deleteCookie = (name: string): void => {
  if (typeof window === 'undefined') return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY) || getCookie(TOKEN_KEY)
}

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  setCookie(TOKEN_KEY, token, 7)
}

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export const setUserRole = (role: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_ROLE_KEY, role)
  setCookie(USER_ROLE_KEY, role, 7)
}

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_ROLE_KEY)
  deleteCookie(TOKEN_KEY)
  deleteCookie(USER_ROLE_KEY)
}

export { setCookie, getCookie, deleteCookie }

// Create axios instance
const apiClient = axios.create({
  baseURL: API_ENDPOINTS.base,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors and token refresh
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors - attempt token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // If this is a refresh request failure, clear tokens and redirect to login
      if (originalRequest.url === API_ENDPOINTS.auth.refresh) {
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      originalRequest._retry = true

      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(apiClient(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const refreshToken = getRefreshToken()
        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        const response = await axios.post(API_ENDPOINTS.auth.refresh, {
          refreshToken,
        })

        const { token: newToken, refreshToken: newRefreshToken } = response.data

        setToken(newToken)
        setRefreshToken(newRefreshToken)

        isRefreshing = false
        onTokenRefreshed(newToken)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
        }

        return apiClient(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        clearTokens()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    // Handle other errors
    const apiError: ApiError = {
      message: error.response?.data?.error?.message || error.response?.data?.message || error.message || 'An error occurred',
      code: error.response?.data?.error?.code || error.response?.data?.error || error.code,
      details: error.response?.data?.error?.details || error.response?.data,
    }

    return Promise.reject(apiError)
  }
)

// Helper to extract error message from various error types
export function getErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('message' in err) {
      return (err as { message: string }).message
    }
  }
  if (typeof err === 'string') {
    return err
  }
  return 'An error occurred'
}

export { apiClient }
