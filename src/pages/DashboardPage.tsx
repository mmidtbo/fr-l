import * as React from "react";
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  AlertTriangle,
  WashingMachine,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/StatusBadge";
import type { Order } from "@/lib/types";
import { formatRupiah, SERVICE_TYPE_LABELS } from "@/lib/types";

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingPickup: number;
  overdueOrders: number;
}

interface ChartData {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

interface DashboardPageProps {
  onNavigateOrders: () => void;
}

export function DashboardPage({ onNavigateOrders }: DashboardPageProps) {
  const { profile } = useAuth();
  const isOwner = profile?.role === "owner";

  const [stats, setStats] = React.useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    pendingPickup: 0,
    overdueOrders: 0,
  });
  const [chartData, setChartData] = React.useState<ChartData[]>([]);
  const [recentOrders, setRecentOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [ordersRes, recentRes] = await Promise.all([
      supabase.from("orders").select("*, customer:customers(name, phone)"),
      supabase
        .from("orders")
        .select("*, customer:customers(name, phone)")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const allOrders: Order[] = ordersRes.data ?? [];
    const recent: Order[] = recentRes.data ?? [];

    const todayOrders = allOrders.filter((o) => o.created_at >= todayStr);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_price, 0);
    const pendingPickup = allOrders.filter((o) => o.status === "ready").length;
    const overdueOrders = allOrders.filter(
      (o) => o.is_overdue && o.status !== "picked_up",
    ).length;

    setStats({
      todayOrders: todayOrders.length,
      todayRevenue,
      pendingPickup,
      overdueOrders,
    });
    setRecentOrders(recent);

    // Build chart data for last 7 days
    const days: ChartData[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayOrders = allOrders.filter((o) => {
        const t = new Date(o.created_at);
        return t >= d && t < next;
      });
      days.push({
        date: d.toISOString().split("T")[0],
        label: d.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
        }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.total_price, 0),
      });
    }
    setChartData(days);
    setLoading(false);
  }

  const orderChartConfig = {
    orders: { label: "Pesanan", color: "var(--chart-1)" },
  };

  const revenueChartConfig = {
    revenue: { label: "Pendapatan", color: "var(--chart-2)" },
  };

  const statCards = [
    {
      title: "Pesanan Hari Ini",
      value: stats.todayOrders,
      subtitle: "Total transaksi masuk hari ini",
      icon: ShoppingBag,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
    },
    ...(isOwner
      ? [
          {
            title: "Pendapatan Hari Ini",
            value: formatRupiah(stats.todayRevenue),
            subtitle: "Total omzet hari ini",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950/30",
          },
        ]
      : []),
    {
      title: "Siap Diambil",
      value: stats.pendingPickup,
      subtitle: "Cucian menunggu pengambilan",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Terlambat",
      value: stats.overdueOrders,
      subtitle: "Order belum diambil >30 hari",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Selamat datang, {profile?.name}! Berikut ringkasan operasional
            Gresik Laundry.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <WashingMachine className="size-4" />
          <span>
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      <div
        className={`grid gap-4 ${isOwner ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}
      >
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="py-6">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {card.subtitle}
                    </p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${card.bg}`}>
                    <card.icon className={`size-5 ${card.color}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div
        className={`grid gap-4 ${isOwner ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}
      >
        {/* Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pesanan 7 Hari Terakhir</CardTitle>
            <CardDescription>Jumlah transaksi masuk per hari</CardDescription>
          </CardHeader>
          <CardContent>
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

        {/* Revenue Chart (Owner only) */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Pendapatan 7 Hari Terakhir
              </CardTitle>
              <CardDescription>Total omzet harian</CardDescription>
            </CardHeader>
            <CardContent>
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

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Pesanan Terbaru</CardTitle>
            <CardDescription>10 transaksi terakhir masuk</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateOrders}
            className="gap-1.5"
          >
            Lihat Semua
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <WashingMachine className="size-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Belum ada pesanan</p>
              <p className="text-sm text-muted-foreground">
                Tambah pesanan pertama untuk memulai
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Order</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Status</TableHead>
                  {isOwner && (
                    <TableHead className="text-center">Total</TableHead>
                  )}
                  <TableHead className="text-center">Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      <span className="font-mono text-sm font-semibold">
                        {order.order_code}
                      </span>
                      {/* {order.needs_weight_label && ( */}
                      {/*   <span className="ml-1 text-amber-500">⚠</span> */}
                      {/* )} */}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {order.customer?.name ?? "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer?.phone ?? "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {SERVICE_TYPE_LABELS[order.service_type]}
                      </span>
                      {order.is_express && (
                        <span className="ml-1 text-xs text-amber-600 font-medium">
                          (Express)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={order.status}
                        isOverdue={order.is_overdue}
                      />
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-center font-medium text-sm">
                        {formatRupiah(order.total_price)}
                      </TableCell>
                    )}
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
