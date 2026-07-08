import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";

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

export const description = "A bar chart with a label";

interface DailySummary {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

const chartConfig = {
  orders: {
    label: "Pesanan",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function BarChartOrdersReportDemo({ data }: { data: DailySummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Volume Pesanan Harian</CardTitle>
        <CardDescription>
          Jumlah transaksi masuk per hari dalam periode yang dipilih
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="w-full flex-1 min-h-[200px] max-h-[250px] lg:max-h-[250px] xl:max-h-[350px]"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="orders" fill="var(--color-orders)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Jumlah pesanan selama periode ini <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Berdasarkan data transaksi harian
        </div>
      </CardFooter>
    </Card>
  );
}
