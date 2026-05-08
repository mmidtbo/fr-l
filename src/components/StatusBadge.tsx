import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/types'

interface StatusBadgeProps {
  status: OrderStatus
  isOverdue?: boolean
  className?: string
}

const statusStyles: Record<OrderStatus, string> = {
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  washing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ready: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  picked_up: 'bg-muted text-muted-foreground',
}

export function StatusBadge({ status, isOverdue, className }: StatusBadgeProps) {
  if (isOverdue && status !== 'picked_up') {
    return (
      <span className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        className
      )}>
        Terlambat
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      statusStyles[status],
      className
    )}>
      {STATUS_LABELS[status]}
    </span>
  )
}
