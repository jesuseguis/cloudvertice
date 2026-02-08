'use client'

import { useAuthStore } from '@/lib/stores/auth-store'
import { getErrorMessage } from '@/lib/api/axios'
import { useToast } from './use-toast'
import type { LoginRequest, RegisterRequest, UpdateProfileRequest, ChangePasswordRequest } from '@/types'

export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    refreshUser,
    clearError,
  } = useAuthStore()

  const { success, error: toastError } = useToast()

  const login = async (credentials: LoginRequest) => {
    try {
      await storeLogin(credentials)
      success('Bienvenido de vuelta', 'Login exitoso')
      return true
    } catch (err) {
      toastError(getErrorMessage(err) || 'Error al iniciar sesión', 'Error de autenticación')
      return false
    }
  }

  const register = async (data: RegisterRequest) => {
    try {
      await storeRegister(data)
      success('Tu cuenta ha sido creada', 'Registro exitoso')
      return true
    } catch (err) {
      toastError(getErrorMessage(err) || 'Error al registrarse', 'Error de registro')
      return false
    }
  }

  const logout = async () => {
    await storeLogout()
    success('Has cerrado sesión correctamente', 'Logout')
  }

  const updateProfile = async (data: UpdateProfileRequest) => {
    try {
      const { authApi } = await import('@/lib/api')
      await authApi.updateProfile(data)
      await refreshUser()
      success('Perfil actualizado correctamente')
      return true
    } catch (err) {
      toastError(getErrorMessage(err) || 'Error al actualizar perfil', 'Error')
      return false
    }
  }

  const changePassword = async (data: ChangePasswordRequest) => {
    try {
      const { authApi } = await import('@/lib/api')
      await authApi.changePassword(data)
      success('Contraseña cambiada correctamente')
      return true
    } catch (err) {
      toastError(getErrorMessage(err) || 'Error al cambiar contraseña', 'Error')
      return false
    }
  }

  const isAdmin = user?.role === 'admin'

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser,
    clearError,
  }
}
