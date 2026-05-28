import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

interface StatusBadgeProps {
  status: OrderStatus;
  isOverdue?: boolean;
  className?: string;
}

const statusStyles: Record<OrderStatus, string> = {
  received: "bg-chart-1/10 text-chart-1",
  proses: "bg-chart-1/10 text-chart-1",
  cuci: "bg-chart-5/10 text-chart-5",
  jemur: "bg-chart-5/10 text-chart-5",
  setrika: "bg-chart-5/10 text-chart-1",
  ready: "bg-primary/10 text-primary",
  picked_up: "bg-muted text-muted-foreground",
};

export function StatusBadge({
  status,
  isOverdue,
  className,
}: StatusBadgeProps) {
  if (isOverdue && status !== "picked_up") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          "bg-destructive/10 text-destructive",
          className,
        )}
      >
        Terlambat
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
