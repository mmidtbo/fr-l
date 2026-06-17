import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatRupiah } from "@/lib/types";
import {
  IconBuildingBank,
  IconCalendarExclamation,
  IconChartBar,
  IconHours24,
  IconShoppingCart,
  IconTrendingUp,
  IconUsers,
} from "@tabler/icons-react";

interface SectionCardsProps {
  totalRevenue: number;
  orderslength: number;
  avgPerDay: number;
  period: string;
  uniqueCustomers: number;
}

export function SectionCards({
  totalRevenue,
  orderslength,
  avgPerDay,
  period,
  uniqueCustomers,
}: SectionCardsProps) {
  const statCards = [
    {
      label: "Total Pendapatan",
      value: formatRupiah(totalRevenue),
      sub: `dalam ${period} hari terakhir`,
      icon: <IconTrendingUp />,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Total Pesanan",
      value: orderslength,
      sub: "transaksi masuk",
      icon: IconShoppingCart,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Rata-rata/Hari",
      value: formatRupiah(Math.round(avgPerDay)),
      sub: "pendapatan harian",
      icon: IconChartBar,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      label: "Pelanggan Aktif",
      value: uniqueCustomers.toString(),
      sub: "pelanggan unik",
      icon: IconUsers,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{statCards[0].label}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statCards[0].value}
          </CardTitle>
          <CardAction>
            <IconChartBar />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium"></div>
          <div className="text-muted-foreground">
            Total pendapatan dalam {period} hari terakhir
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{statCards[1].label}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statCards[1].value}
          </CardTitle>
          <CardAction>
            <IconShoppingCart />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium"></div>
          <div className="text-muted-foreground">
            {orderslength} transaksi dalam {period} hari
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{statCards[2].label}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statCards[2].value}
          </CardTitle>
          <CardAction>
            <IconHours24 />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium"></div>
          <div className="text-muted-foreground">
            Rata-rata pendapatan per hari
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>{statCards[3].label}</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {statCards[3].value}
          </CardTitle>
          <CardAction>
            <IconCalendarExclamation />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium"></div>
          <div className="text-muted-foreground">
            Pelanggan yang bertransaksi dalam {period} hari
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
