import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-white',
        primary: 'border-transparent bg-primary text-white',
        secondary: 'border-transparent bg-card-dark border border-border-dark text-text-secondary',
        success: 'border-transparent bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        warning: 'border-transparent bg-amber-500/20 text-amber-400 border border-amber-500/30',
        danger: 'border-transparent bg-red-500/20 text-red-400 border border-red-500/30',
        info: 'border-transparent bg-blue-500/20 text-blue-400 border border-blue-500/30',
        outline: 'text-text-secondary border border-border-dark',
      },
      size: {
        default: 'px-2.5 py-0.5',
        sm: 'px-2 py-0.5 text-[10px]',
        lg: 'px-3 py-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

// Status-specific badge components for VPS and Orders
export function StatusBadge({
  status,
  className,
  children,
  variant,
}: {
  status: string;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}) {
  const badgeVariant = variant ?? (() => {
    const s = status.toLowerCase()
    if (['running', 'active', 'completed', 'online', 'paid', 'operational'].includes(s)) {
      return 'success' as const
    }
    if (['stopped', 'inactive', 'cancelled', 'offline'].includes(s)) {
      return 'secondary' as const
    }
    if (['pending', 'processing', 'provisioning', 'warning', 'restarting'].includes(s)) {
      return 'warning' as const
    }
    if (['suspended', 'expired', 'error', 'failed', 'critical'].includes(s)) {
      return 'danger' as const
    }
    return 'info' as const
  })()

  return (
    <Badge variant={badgeVariant} className={className}>
      {children || status}
    </Badge>
  )
}
