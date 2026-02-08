'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useVpsActions } from '@/lib/hooks/use-vps'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Server,
  MoreVertical,
  Power,
  RefreshCw,
  HardDrive,
  Activity,
  Play,
} from 'lucide-react'
import type { VPSInstance } from '@/types'
import type { VPSStatus } from '@/types'

interface VpsCardProps {
  vps: VPSInstance
}

const getStatusIcon = (status: VPSStatus) => {
  const statusLower = status.toLowerCase()
  switch (statusLower) {
    case 'running':
      return <div className="w-2 h-2 rounded-full bg-emerald-500" />
    case 'stopped':
      return <div className="w-2 h-2 rounded-full bg-text-secondary" />
    case 'restarting':
      return <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
    case 'provisioning':
      return <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
    case 'suspended':
      return <div className="w-2 h-2 rounded-full bg-orange-500" />
    case 'expired':
    case 'terminated':
      return <div className="w-2 h-2 rounded-full bg-red-500" />
    default:
      return <div className="w-2 h-2 rounded-full bg-gray-500" />
  }
}

export function VpsCard({ vps }: VpsCardProps) {
  const router = useRouter()
  const { executeAction } = useVpsActions(vps.id)
  const [isActionPending, setIsActionPending] = useState(false)

  const handleAction = async (action: 'start' | 'stop' | 'restart', e: React.MouseEvent) => {
    e.stopPropagation()
    setIsActionPending(true)
    try {
      await executeAction(action)
    } finally {
      setIsActionPending(false)
    }
  }

  const status = (vps.status?.toLowerCase() || 'pending') as VPSStatus
  // Only show action buttons if VPS is provisioned (has contaboInstanceId)
  const isProvisioned = !!vps.contaboInstanceId

  return (
    <Card
      className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => router.push(`/servers/${vps.id}`)}
    >
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-white">{vps.name || vps.displayName || 'Sin nombre'}</h3>
              <p className="text-xs text-text-secondary font-mono">
                {vps.ipAddress || 'Pendiente'}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/servers/${vps.id}`) }}>
                <Activity className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/servers/${vps.id}?tab=snapshots`) }}>
                <HardDrive className="mr-2 h-4 w-4" />
                Snapshots
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          {getStatusIcon(vps.status || 'PENDING')}
          <StatusBadge status={status} />
          {!isProvisioned && (
            <span className="text-xs text-amber-400 ml-2">
              (Sin aprovisionar)
            </span>
          )}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-background-dark rounded p-2">
            <p className="text-lg font-semibold text-white">{vps.specs?.cpuCores || '-'}</p>
            <p className="text-[10px] text-text-secondary">vCPU</p>
          </div>
          <div className="bg-background-dark rounded p-2">
            <p className="text-lg font-semibold text-white">{vps.specs?.ramGB || '-'}GB</p>
            <p className="text-[10px] text-text-secondary">RAM</p>
          </div>
          <div className="bg-background-dark rounded p-2">
            <p className="text-lg font-semibold text-white">{vps.specs?.diskGB || '-'}</p>
            <p className="text-[10px] text-text-secondary">{vps.specs?.diskType || '-'}</p>
          </div>
        </div>

        {/* Quick Actions */}
        {!isProvisioned ? (
          <div className="text-center p-3 bg-amber-500/10 border border-amber-500/30 rounded">
            <p className="text-xs text-amber-400">
              El VPS está siendo provisionado. Los controles estarán disponibles pronto.
            </p>
          </div>
        ) : status === 'running' ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => handleAction('restart', e)}
              disabled={isActionPending}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isActionPending ? 'animate-spin' : ''}`} />
              Reiniciar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-400 hover:text-red-400"
              onClick={(e) => handleAction('stop', e)}
              disabled={isActionPending}
            >
              <Power className="h-3 w-3 mr-1" />
              Detener
            </Button>
          </div>
        ) : status === 'stopped' ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => handleAction('start', e)}
            disabled={isActionPending}
          >
            <Play className="h-3 w-3 mr-1" />
            Iniciar
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full" disabled>
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Procesando...
          </Button>
        )}
      </div>
    </Card>
  )
}
