import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRupiah, type DashboardStats } from "@/lib/types";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconClipboardData,
  IconPackageExport,
  IconClockExclamation,
  IconCalendarExclamation,
  IconExclamationMark,
} from "@tabler/icons-react";

interface SectionCardsProps {
  stats: DashboardStats;
  isOwner: boolean;
}

export function SectionCards({ stats, isOwner }: SectionCardsProps) {
  const statCards = [
    {
      title: "Pesanan Hari Ini",
      value: stats.todayOrders,
      subtitle: "Total transaksi masuk hari ini",
      icon: IconClipboardData,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Pendapatan Hari Ini",
      value: formatRupiah(stats.todayRevenue),
      subtitle: "Total omzet hari ini",
      icon: IconTrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Siap Diambil",
      value: stats.pendingPickup,
      subtitle: "Cucian menunggu pengambilan",
      icon: IconPackageExport,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Terlambat",
      value: stats.overdueOrders,
      subtitle: "Order belum diambil >30 hari",
      icon: IconClockExclamation,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  const gridColl = isOwner
    ? "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card"
    : "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-3 @5xl/main:grid-cols-3 dark:*:data-[slot=card]:bg-card";

  return (
    <div className={gridColl}>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{statCards[0].title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statCards[0].value}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.ordersCount >= 0 ? (
                <>
                  <IconTrendingUp />+{stats.ordersCount}
                </>
              ) : stats.ordersCount < 0 ? (
                <>
                  <IconTrendingDown />
                  {stats.ordersCount}
                </>
              ) : (
                <>
                  <IconTrendingUp className="opacity-50" />0
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.ordersCount > 0 ? (
              <>
                Naik {stats.ordersCount} pelanggan dari kemarin
                <IconTrendingUp className="size-4" />
              </>
            ) : stats.ordersCount < 0 ? (
              <>
                Turun {Math.abs(stats.ordersCount)} dari kemarin
                <IconTrendingDown className="size-4" />
              </>
            ) : (
              <>Sama seperti kemarin</>
            )}
          </div>
          <div className="text-muted-foreground">{statCards[0].subtitle}</div>
        </CardFooter>
      </Card>
      {isOwner && (
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>{statCards[1].title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {statCards[1].value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {stats.percentageDiff >= 0 ? (
                  <>
                    <IconTrendingUp />+{stats.percentageDiff}%
                  </>
                ) : (
                  <>
                    <IconTrendingDown />
                    {stats.percentageDiff}%
                  </>
                )}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {stats.percentageDiff >= 0 ? (
                <>
                  Naik {stats.percentageDiff}% dari kemarin
                  <IconTrendingUp className="size-4" />
                </>
              ) : (
                <>
                  Turun {Math.abs(stats.percentageDiff)}% dari kemarin
                  <IconTrendingDown className="size-4" />
                </>
              )}
            </div>
            <div className="text-muted-foreground">{statCards[1].subtitle}</div>
          </CardFooter>
        </Card>
      )}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{statCards[2].title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statCards[2].value}
          </CardTitle>
          <CardAction>
            <IconPackageExport />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Menunggu pengambilan pelanggan
          </div>
          <div className="text-muted-foreground">{statCards[2].subtitle}</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{statCards[3].title}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statCards[3].value}
          </CardTitle>
          <CardAction>
            <IconCalendarExclamation />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Perlu tindakan segera
          </div>
          <div className="text-muted-foreground">{statCards[3].subtitle}</div>
        </CardFooter>
      </Card>
    </div>
  );
}
