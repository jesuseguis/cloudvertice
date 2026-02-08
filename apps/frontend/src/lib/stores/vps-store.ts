import { create } from 'zustand'
import type { VPSInstance, VPSMetrics } from '@/types'

interface VPSState {
  // State
  selectedVps: VPSInstance | null
  vpsMetrics: Map<string, VPSMetrics>
  isPolling: boolean
  pollingInterval: number | null

  // Actions
  setSelectedVps: (vps: VPSInstance | null) => void
  updateVpsMetrics: (vpsId: string, metrics: VPSMetrics) => void
  updateVpsStatus: (vpsId: string, status: VPSInstance['status']) => void
  startPolling: (interval?: number) => void
  stopPolling: () => void
  clearMetrics: (vpsId: string) => void
}

export const useVpsStore = create<VPSState>((set, get) => ({
  // Initial state
  selectedVps: null,
  vpsMetrics: new Map(),
  isPolling: false,
  pollingInterval: null,

  // Set selected VPS
  setSelectedVps: (vps) => set({ selectedVps: vps }),

  // Update metrics for a specific VPS
  updateVpsMetrics: (vpsId, metrics) =>
    set((state) => {
      const newMap = new Map(state.vpsMetrics)
      newMap.set(vpsId, metrics)
      return { vpsMetrics: newMap }
    }),

  // Update status for a specific VPS
  updateVpsStatus: (vpsId, status) =>
    set((state) => {
      if (state.selectedVps?.id === vpsId) {
        return {
          selectedVps: { ...state.selectedVps, status },
        }
      }
      return {}
    }),

  // Start polling for VPS updates
  startPolling: (interval = 5000) => {
    const { isPolling, pollingInterval, stopPolling } = get()

    if (isPolling) {
      stopPolling()
    }

    const intervalId = window.setInterval(() => {
      // Polling logic will be handled by the component using this store
      // This just sets up the interval
    }, interval)

    set({
      isPolling: true,
      pollingInterval: intervalId,
    })
  },

  // Stop polling
  stopPolling: () => {
    const { pollingInterval } = get()
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    set({
      isPolling: false,
      pollingInterval: null,
    })
  },

  // Clear metrics for a specific VPS
  clearMetrics: (vpsId) =>
    set((state) => {
      const newMap = new Map(state.vpsMetrics)
      newMap.delete(vpsId)
      return { vpsMetrics: newMap }
    }),
}))
