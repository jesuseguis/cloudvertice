import { create } from 'zustand'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info'
  duration?: number
  action?: React.ReactNode
}

interface UIState {
  // Sidebar
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean

  // Toasts
  toasts: Toast[]

  // Modals
  createSnapshotOpen: boolean
  selectedVpsId: string | null

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleMobileMenu: () => void
  closeMobileMenu: () => void

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void

  // Modal actions
  openCreateSnapshot: (vpsId: string) => void
  closeCreateSnapshot: () => void
}

// Helper to generate unique IDs
let toastId = 0
const generateToastId = () => `toast-${toastId++}`

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  toasts: [],
  createSnapshotOpen: false,
  selectedVpsId: null,

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Mobile menu actions
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),

  // Toast actions
  addToast: (toast) => {
    const id = generateToastId()
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    // Auto-remove toast after duration (default 5000ms)
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, duration)
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),

  // Modal actions
  openCreateSnapshot: (vpsId) =>
    set({ createSnapshotOpen: true, selectedVpsId: vpsId }),

  closeCreateSnapshot: () =>
    set({ createSnapshotOpen: false, selectedVpsId: null }),
}))
