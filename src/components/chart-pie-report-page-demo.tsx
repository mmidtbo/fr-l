import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
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
} from "@/components/ui/chart";
import { formatRupiah } from "@/lib/types";

export const description = "A donut chart with text";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type ChartItem = {
  id: string;
  service_name: string;
  total_order: number;
  total_revenue: number;
  fill: string;
};
export type accInterface = {
  [service_name: string]: {
    label: string;
    color: string;
  };
};
export function ChartPieDonutReport(data: any) {
  console.log("data", data);
  const chartData = data.data.map(
    (od: { service_name: string; total_revenue: string }, index: number) => {
      return {
        service_name: od.service_name,
        total_revenue: Number(od.total_revenue),
        fill: colors[index % colors.length],
      };
    },
  );

  const dynamicChartConfig = React.useMemo(() => {
    return chartData.reduce((acc: accInterface, item: ChartItem) => {
      acc[item.service_name] = {
        label: item.service_name,
        color: item.fill,
      };

      return acc;
    }, {});
  }, [chartData]);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Distribusi Layanan</CardTitle>
        <CardDescription>Proporsi Pesanan per Layanan</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={dynamicChartConfig}
          className="mx-auto aspect-square max-h-[250px] lg:max-h-[250px] xl:max-h-[350px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => [
                    <span key="name" className="text-muted-foreground">
                      {name}
                    </span>,
                    <span
                      key="value"
                      className="font-mono font-medium text-foreground tabular-nums"
                    >
                      {formatRupiah(Number(value))}
                    </span>,
                  ]}
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="total_revenue"
              nameKey="service_name"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          13
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          Layanan
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Total pendapatan dari semua layanan
        </div>
        <div className="leading-none text-muted-foreground">
          Berdasarkan proporsi pendapatan per layanan
        </div>
      </CardFooter>
    </Card>
  );
}
