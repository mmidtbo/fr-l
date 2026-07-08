// import { BarChartOrdersReport } from "@/components/barchart-orders-report-page";
import { BarChartReport } from "@/components/barchart-report-page";
import { BarChartOrdersReportDemo } from "@/components/barchart-report-page-demo";
// import { ChartPieReport } from "@/components/chart-pie-report-page";
import { ChartPieDonutReport } from "@/components/chart-pie-report-page-demo";
import { DataTable } from "@/components/demo-pages/report-data-table";
import { ChartLineReport } from "@/components/line-chart-report-page";
import { SectionCards } from "@/components/section-cards-reports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpinnerEmpty } from "@/components/ui/spinner-empty";
import { apiSafe } from "@/lib/api/axios";
import type {
  AvgDay,
  DailyRevenue,
  Income,
  IncomeService,
  OrdersCountDay,
} from "@/lib/types";
import { URL } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";

export function ReportsPage() {
  const [period, setPeriod] = React.useState("30");

  const dbh = useQuery({
    queryKey: ["dashboard", period],
    queryFn: async () => {
      const [ordersRes, incomeRes, avgRes, incomeServiceRes, dailyRevenueRes] =
        await Promise.all([
          apiSafe.get<OrdersCountDay>(
            `${URL}/dashboard/orderscountday?day=${period}`,
          ),
          apiSafe.get<Income>(`${URL}/dashboard/income?day=${period}`),
          apiSafe.get<AvgDay>(`${URL}/dashboard/avgday?day=${period}`),
          apiSafe.get<IncomeService>(
            `${URL}/dashboard/incomeservice?day=${period}`,
          ),
          apiSafe.get<DailyRevenue>(`${URL}/orders/dailyrevenue?day=${period}`),
        ]);
      const ordersData = ordersRes.data;
      const incomeData = incomeRes.data;
      const avgData = avgRes.data;
      const incomeServiceData = incomeServiceRes.data;
      const dailyRevenueData = dailyRevenueRes.data;

      return {
        ordersData,
        incomeData,
        avgData,
        incomeServiceData,
        dailyRevenueData,
      };
    },
  });

  const dailyChartData = React.useMemo(() => {
    return (dbh.data?.dailyRevenueData?.data ?? []).map((d) => ({
      ...d,
      label: new Date(d.date + "T00:00:00").toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      }),
    }));
  }, [dbh.data?.dailyRevenueData]);

  const serviceBreakdown = dbh.data?.incomeServiceData;

  const sortedServiceData = React.useMemo(() => {
    const data = serviceBreakdown?.data ?? [];
    return [...data]
      .map((d) => ({ ...d, total_revenue: Number(d.total_revenue) }))
      .sort((a, b) => b.total_revenue - a.total_revenue);
  }, [serviceBreakdown]);

  if (dbh.isPending) {
    return <SpinnerEmpty />;
  }

  const orderTotal =
    Number(dbh.data?.ordersData?.total) === undefined
      ? 0
      : Number(dbh.data?.ordersData?.total);

  const totalRevenue = Number(
    dbh.data?.incomeData?.data.income == undefined
      ? 0
      : dbh.data.incomeData?.data.income,
  );
  const avgPerDay =
    Number(orderTotal) > 0 ? Number(dbh.data?.avgData?.data.avg_day) : 0;
  const uniqueCustomers = new Set(
    dbh.data?.ordersData?.data.map((o) => o.customer_id),
  ).size;

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
            <SelectItem value="all">Semua waktu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SectionCards
        totalRevenue={totalRevenue}
        orderslength={orderTotal}
        avgPerDay={avgPerDay}
        period={period}
        uniqueCustomers={uniqueCustomers}
      />

      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-2 dark:*:data-[slot=card]:bg-card">
        <ChartLineReport data={dailyChartData} />
        <BarChartOrdersReportDemo data={dailyChartData} />
        <ChartPieDonutReport data={sortedServiceData} />
        {/* <ChartPieReport data={sortedServiceData} /> */}
        <BarChartReport data={sortedServiceData} />
      </div>

      <DataTable
        data={serviceBreakdown?.data ?? []}
        totalRevenue={totalRevenue}
      />
    </div>
  );
}
