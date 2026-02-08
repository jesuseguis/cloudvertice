import { useUIStore } from '@/lib/stores/ui-store'

export interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info'
  duration?: number
}

export function useToast() {
  const { toasts, addToast, removeToast, clearToasts } = useUIStore()

  const toast = (options: ToastOptions) => {
    addToast({
      ...options,
      duration: options.duration ?? 5000,
    })
  }

  const success = (description: string, title?: string) => {
    toast({ title, description, variant: 'success' })
  }

  const error = (description: string, title?: string) => {
    toast({ title, description, variant: 'danger', duration: 10000 })
  }

  const warning = (description: string, title?: string) => {
    toast({ title, description, variant: 'warning' })
  }

  const info = (description: string, title?: string) => {
    toast({ title, description, variant: 'info' })
  }

  return {
    toasts,
    toast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearToasts,
  }
}
