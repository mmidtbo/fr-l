import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";

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
import { formatRupiah } from "@/lib/types";

function abbreviate(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

interface ServiceItem {
  id: string;
  service_name: string;
  total_order: number;
  total_revenue: number;
}

const chartConfig = {
  revenue: {
    label: "Pendapatan",
    color: "var(--chart-1)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig;

export function BarChartReport({ data }: { data: ServiceItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ranking Layanan by Revenue</CardTitle>
        <CardDescription>
          Perbandingan pendapatan per layanan (tertinggi ke terendah)
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
            layout="vertical"
            margin={{ right: 12 }}
            barCategoryGap="20%"
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="service_name"
              type="category"
              tickLine={false}
              axisLine={true}
              stroke="var(--border)"
              tickMargin={8}
              width={60}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickFormatter={(value: string) => abbreviate(value)}
            />
            <XAxis dataKey="total_revenue" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => [formatRupiah(Number(value))]}
                />
              }
            />
            <Bar
              dataKey="total_revenue"
              fill="var(--color-revenue)"
              radius={[0, 4, 4, 0]}
              maxBarSize={32}
            >
              <LabelList
                dataKey="total_revenue"
                position="right"
                offset={8}
                className="fill-foreground text-xs font-medium"
                formatter={(v) => formatRupiah(v as number)}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Perbandingan pendapatan antar layanan
        </div>
        <div className="leading-none text-muted-foreground">
          Diurutkan dari tertinggi ke terendah
        </div>
      </CardFooter>
    </Card>
  );
}
