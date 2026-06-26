import { ChartLineDots } from "@/components/chart-line-dashboard";
import { ChartPieDonutText } from "@/components/chart-pie-demo";
import { DataTable } from "@/components/demo-pages/dashboard-data-table";
import { SectionCards } from "@/components/section-cards";
import { SpinnerEmpty } from "@/components/ui/spinner-empty";
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

  const gridColl = isOwner
    ? "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-2 dark:*:data-[slot=card]:bg-card"
    : "grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-2 dark:*:data-[slot=card]:bg-card";

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
    queryFn: async () => {
      const data = await apiSafe.get<LineChart>(LINE_CHART);
      return data.data?.data;
    },
  });

  const pie_chart = useQuery({
    queryKey: ["pie_chart"],
    queryFn: async () => {
      const data = await apiSafe.get<BC>(BAR_CHART);
      return data.data?.data;
    },
  });

  if (pie_chart.isPending) {
    return <SpinnerEmpty />;
  }

  if (line_chart.isPending) {
    return <SpinnerEmpty />;
  }

  if (isPending) {
    return <SpinnerEmpty />;
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

      {isOwner ?? (
        <div className={gridColl}>
          <ChartLineDots data={line_chart.data} />
          <ChartPieDonutText data={pie_chart.data} />
        </div>
      )}

      {/* Recent Orders */}
      <DataTable data={data.recentOrders ?? []} />
    </>
  );
}
