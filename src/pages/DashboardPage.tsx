import { ChartLineDots } from "@/components/chart-line-dashboard";
import { ChartPieDonutText } from "@/components/chart-pie-demo";
import { DataTable } from "@/components/demo-pages/dashboard-data-table";
import { SectionCards } from "@/components/section-cards";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import api, { apiSafe } from "@/lib/api/axios";
import type {
  BarChart as BC,
  DashboardRecentOrders,
  DashboardResponseRaw,
  LineChart,
  PercentageDiffRaw,
} from "@/lib/types";
import {
  BAR_CHART,
  LINE_CHART,
  ORDERS_COUNT,
  PERCENTAGE_DIFF,
  STATS,
} from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export function DashboardPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const gridColl =
    "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-2 dark:*:data-[slot=card]:bg-card";

  const {
    data = {
      stats: {
        overdueOrders: 0,
        pendingPickup: 0,
        todayOrders: 0,
        todayRevenue: 0,
        percentageDiff: 0,
        ordersCount: 0,
      },
      recentOrders: [],
    },
    isLoading,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [stats, percentageDiff, ordersCount] = await Promise.all([
        apiSafe.get<DashboardResponseRaw>(STATS),
        apiSafe.get<PercentageDiffRaw>(PERCENTAGE_DIFF),
        api.get(ORDERS_COUNT),
      ]);

      const stats_all = {
        overdueOrders: Number(stats.data?.data.stats.overdueOrders),
        pendingPickup: Number(stats.data?.data.stats.pendingPickup),
        todayOrders: Number(stats.data?.data.stats.todayOrders),
        todayRevenue: Number(stats.data?.data.stats.todayRevenue),
        percentageDiff: Number(percentageDiff.data?.data.percentage_diff),
        ordersCount: Number(ordersCount.data),
      };

      const recentOrders = stats.data?.data.recentOrders.map(
        (item): DashboardRecentOrders => {
          return {
            id: item.id,
            order_code: item.order_code,
            customer_name: item.customers?.name ?? "-",
            customer_phone: item.customers?.phone ?? "-",
            service_name: item.service_prices?.name ?? "-",
            is_express: item.is_express,
            quantity: Number(item.quantity),
            total_price: Number(item.total_price),
            status: item.status as string,
            payment_status: item.payment_status as string,
            estimated_done: (item.estimated_done as string) ?? null,
            picked_up_at: (item.picked_up_at as string) ?? null,
            created_at: item.created_at as string,
          };
        },
      );

      return {
        stats: stats_all,
        recentOrders: recentOrders,
      };
    },
  });

  const line_chart = useQuery({
    queryKey: ["line_chart"],
    enabled: isOwner,
    queryFn: async () => {
      const data = await apiSafe.get<LineChart>(LINE_CHART);
      return data.data?.data;
    },
  });

  const pie_chart = useQuery({
    queryKey: ["pie_chart"],
    enabled: isOwner,
    queryFn: async () => {
      const data = await apiSafe.get<BC>(BAR_CHART);
      return data.data?.data;
    },
  });

  if (isPending) {
    return (
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="grid grid-cols-2 gap-4 @xl/main:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center lg:px-6">
        <p className="text-sm text-muted-foreground">
          Gagal memuat data dashboard.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <>
      <SectionCards
        stats={{
          ordersCount: Number(data?.stats.ordersCount),
          percentageDiff: Number(data?.stats.percentageDiff),
          overdueOrders: Number(data?.stats.overdueOrders),
          pendingPickup: Number(data?.stats.pendingPickup),
          todayOrders: Number(data?.stats.todayOrders),
          todayRevenue: Number(data?.stats.todayRevenue),
        }}
        isOwner={isOwner}
        isLoading={isLoading}
      />

      {isOwner ? (
        <div className={gridColl}>
          {line_chart.isPending ? (
            <Skeleton className="h-[400px] w-full rounded-xl" />
          ) : (
            <ChartLineDots data={line_chart.data} />
          )}
          {pie_chart.isPending ? (
            <Skeleton className="h-[400px] w-full rounded-xl" />
          ) : (
            <ChartPieDonutText data={pie_chart.data} />
          )}
        </div>
      ) : (
        <></>
      )}

      {/* Recent Orders */}
      <DataTable data={data.recentOrders ?? []} />
    </>
  );
}
