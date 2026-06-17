import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A bar chart";

const orderChartConfig = {
  orders: { label: "Pesanan", color: "var(--chart-1)" },
};

// const revenueChartConfig = {
//   revenue: { label: "Pendapatan", color: "var(--chart-1)" },
// };

interface ChartData {
  date: string;
  label: string;
  orders: number;
  revenue: number;
}

// const chartData = [
//   { month: "January", desktop: 186 },
//   { month: "February", desktop: 305 },
//   { month: "March", desktop: 237 },
//   { month: "April", desktop: 73 },
//   { month: "May", desktop: 209 },
//   { month: "June", desktop: 214 },
// ];
//
// const chartConfig = {
//   desktop: {
//     label: "Desktop",
//     color: "var(--chart-1)",
//   },
// } satisfies ChartConfig;

export function ChartBarOrders({ data }: { data: ChartData[] }) {
  console.log(data);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pesanan 7 Hari Terakhir</CardTitle>
        <CardDescription>Jumlah transaksi masuk per hari</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={orderChartConfig}>
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {/* <CardFooter className="flex-col items-start gap-2 text-sm"> */}
      {/*   <div className="flex gap-2 leading-none font-medium"> */}
      {/*     Trending up by 5.2% this month <TrendingUp className="h-4 w-4" /> */}
      {/*   </div> */}
      {/*   <div className="leading-none text-muted-foreground"> */}
      {/*     Showing total visitors for the last 6 months */}
      {/*   </div> */}
      {/* </CardFooter> */}
    </Card>
  );
}
