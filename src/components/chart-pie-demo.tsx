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

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type ChartItem = {
  service_name: string;
  jumlah: number;
  fill: string;
};
type accInterface = {
  [service_name: string]: {
    label: string;
    color: string;
  };
};
export function ChartPieDonutText(data: any) {
  const chartData = data.data.map(
    (od: { service_name: string; jumlah: string }, index: number) => {
      return {
        service_name: od.service_name,
        jumlah: Number(od.jumlah),
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
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="jumlah"
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
          Total layanan terpesan
        </div>
        <div className="leading-none text-muted-foreground">
          Berdasarkan jumlah pesanan
        </div>
      </CardFooter>
    </Card>
  );
}
