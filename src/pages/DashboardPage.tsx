import { DataTable } from "@/components/demo-pages/dashboard-data-table";
import { SectionCards } from "@/components/section-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api/axios";
import type { DashboardRecentOrders, DashboardStats, Order } from "@/lib/types";
import {
  formatRupiah,
  ORDERS_ALL,
  ORDERS_COUNT,
  PERCENTAGE_DIFF,
  STATS,
} from "@/lib/types";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

interface ChartData {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  const [stats, setStats] = React.useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingPickup: 0,
    overdueOrders: 0,
    percentageDiff: 0,
    ordersCount: 0,
  });
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<
    DashboardRecentOrders[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  function checkOwner() {
    if (user?.role === "owner") {
      return "grid grid-cols-2 gap-4 px-4 lg:px-6";
    }
    return "px-4 lg:px-6";
  }

  async function fetchDashboardData(): Promise<void> {
    setLoading(true);
    try {
      const [dashboardRes, ordersRes, percentageDiff, ordersCount] =
        await Promise.all([
          await api.get(STATS),
          await api.get(ORDERS_ALL),
          await api.get(PERCENTAGE_DIFF),
          await api.get(ORDERS_COUNT),
        ]);

      const ordersData =
        ordersRes.data.filter((order: Order): boolean => {
          return order.customers?.name !== undefined;
        }) ?? [];
      const dashboardData = dashboardRes.data.recentOrders.map(
        (item: Order) => {
          return {
            id: item.id,
            order_code: item.order_code,
            customer_name: (item as any).customers?.name ?? "-",
            customer_phone: (item as any).customers?.phone ?? "-",
            service_name: (item as any).service_prices?.name ?? "-",
            is_express: item.is_express,
            service_category: (item as any).service_prices?.category ?? "-",
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

      setStats({
        overdueOrders: dashboardRes.data.stats.overdueOrders,
        pendingPickup: dashboardRes.data.stats.pendingPickup,
        todayOrders: dashboardRes.data.stats.todayOrders,
        todayRevenue: dashboardRes.data.stats.todayRevenue,
        percentageDiff: Number(percentageDiff),
        ordersCount: Number(ordersCount),
      });
      setRecentOrders(dashboardData);

      // Build chart data (last 30 days)
      const days: {
        date: string;
        label: string;
        orders: number;
        revenue: number;
      }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const dayOrders = ordersData.filter((o: Order) => {
          const t = new Date(o.created_at);
          return t >= d && t < next;
        });
        days.push({
          date: d.toISOString().split("T")[0],
          label: d.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
          }),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((s, o) => s + o.total_price, 0),
        });
      }
      setChartData(days);
    } catch (error) {
      console.error("Gagal memuat dashboard", error);
    } finally {
      setLoading(false);
    }
  }

  const orderChartConfig = {
    orders: { label: "Pesanan", color: "var(--chart-1)" },
  };

  const revenueChartConfig = {
    revenue: { label: "Pendapatan", color: "var(--chart-1)" },
  };

  return (
    <>
      <SectionCards stats={stats} isOwner={isOwner} />

      <div className={checkOwner()}>
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-base">Pesanan 7 Hari Terakhir</CardTitle>
            <CardDescription>Jumlah transaksi masuk per hari</CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ChartContainer config={orderChartConfig} className="h-48 w-full">
                <BarChart data={chartData} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="orders"
                    fill="var(--color-orders)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        {isOwner && (
          <Card className="@container/card">
            <CardHeader>
              <CardTitle className="text-base">
                Pendapatan 7 Hari Terakhir
              </CardTitle>
              <CardDescription>Total omzet harian</CardDescription>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ChartContainer
                  config={revenueChartConfig}
                  className="h-48 w-full"
                >
                  <AreaChart data={chartData} accessibilityLayer>
                    <defs>
                      <linearGradient
                        id="revenueGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-revenue)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-revenue)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [
                            formatRupiah(Number(value)),
                            "Pendapatan",
                          ]}
                        />
                      }
                    />
                    <Area
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      fill="url(#revenueGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Revenue Chart (Owner only) */}

      {/* Recent Orders */}
      <DataTable data={recentOrders} />
    </>
  );
}
