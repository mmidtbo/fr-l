import { DataTable } from "@/components/demo-pages/report-data-table";
import { SectionCards } from "@/components/section-cards-reports";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api/axios";
import type { Avgday, Income, IncomeService, Order } from "@/lib/types";
import { formatRupiah, ORDERS_ALL, URL } from "@/lib/types";
import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

interface DailySummary {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

export function ReportsPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState("30");
  const [income, setIncome] = React.useState<Income>();
  const [avgday, setAvgday] = React.useState<Avgday>();
  const [incomeservice, setIncomeService] = React.useState<IncomeService[]>([]);

  React.useEffect((): void => {
    fetchData();
  }, [period]);

  async function fetchData(): Promise<void> {
    setLoading(true);
    try {
      const [ordersRes, incomeRes, avgRes, incomeServiceRes] =
        await Promise.all([
          api.get(ORDERS_ALL),
          api.get(`${URL}/dashboard/income?day=${period}`),
          api.get(`${URL}/dashboard/avgday?day=${period}`),
          api.get(`${URL}/dashboard/incomeservice`),
        ]);
      const ordersData: Order[] =
        ordersRes.data.filter((order: Order): boolean => {
          return order.customers?.name !== undefined;
        }) ?? [];
      const incomeData = incomeRes.data.income;
      const avgdayData = avgRes.data.avg_day;
      const incomeServiceData = incomeServiceRes.data;
      console.log(incomeServiceData.length);

      setOrders(ordersData);
      setIncome(incomeData);
      setAvgday(avgdayData);
      setIncomeService(incomeServiceData);
    } catch {
      // silent
    }
    setLoading(false);
  }

  const dailyData = React.useMemo((): DailySummary[] => {
    const days: DailySummary[] = [];
    const count = parseInt(period);
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayOrders = orders.filter((o: Order): boolean => {
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
    return days;
  }, [orders, period]);

  const totalRevenue = Number(income == undefined ? 0 : income);
  const avgPerDay = orders.length > 0 ? Number(avgday) : 0;
  const uniqueCustomers = new Set(orders.map((o) => o.customer_id)).size;

  const serviceBreakdown: IncomeService[] = incomeservice!;
  if (!serviceBreakdown) {
    return;
  }

  const chartConfig = {
    revenue: { label: "Pendapatan", color: "var(--chart-1)" },
    orders: { label: "Pesanan", color: "var(--chart-1)" },
  };

  // Show last N days in chart (max 30 for readability)
  const chartData = dailyData.filter((_, i, arr) => {
    if (arr.length <= 14) return true;
    return i % Math.ceil(arr.length / 14) === 0 || i === arr.length - 1;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col mx-4 lg:mx-6 gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
          <p className="text-muted-foreground">
            Analisis omzet dan transaksi Gresik Laundry
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 Hari Terakhir</SelectItem>
            <SelectItem value="14">14 Hari Terakhir</SelectItem>
            <SelectItem value="30">30 Hari Terakhir</SelectItem>
            <SelectItem value="90">90 Hari Terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <SectionCards
        totalRevenue={totalRevenue}
        orderslength={orders.length}
        avgPerDay={avgPerDay}
        period={period}
        uniqueCustomers={uniqueCustomers}
      />

      {/* Revenue Chart */}

      <div className="px-4 lg:px-6 space-y-6">
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-base">Tren Pendapatan Harian</CardTitle>
            <CardDescription>
              Total omzet per hari dalam periode yang dipilih
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-56 w-full">
                <LineChart data={chartData} accessibilityLayer>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
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
                        formatter={(value) => [formatRupiah(Number(value))]}
                      />
                    }
                  />
                  <Line
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card className="@container/card">
          <CardHeader>
            <CardTitle className="text-base">Volume Pesanan Harian</CardTitle>
            <CardDescription>Jumlah transaksi masuk per hari</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ChartContainer config={chartConfig} className="h-48 w-full">
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
      </div>

      {/* Service Breakdown */}
      <DataTable data={serviceBreakdown} totalRevenue={totalRevenue} />
    </div>
  );
}
