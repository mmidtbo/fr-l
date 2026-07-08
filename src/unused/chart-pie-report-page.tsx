import { Cell, Pie, PieChart } from "recharts";

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
  type ChartConfig,
} from "@/components/ui/chart";
import { formatRupiah } from "@/lib/types";

interface ServiceItem {
  id: string;
  service_name: string;
  total_order: number;
  total_revenue: number;
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
];

const chartConfig = {
  revenue: {
    label: "Pendapatan",
  },
} satisfies ChartConfig;

export function ChartPieReport({ data }: { data: ServiceItem[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-base">
          Komposisi Pendapatan per Layanan
        </CardTitle>
        <CardDescription>
          Persentase pendapatan dari masing-masing layanan
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [formatRupiah(Number(value))]}
                />
              }
            />
            <Pie
              data={data}
              dataKey="total_revenue"
              nameKey="service_name"
              label
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
