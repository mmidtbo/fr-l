import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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

export const description = "A line chart with dots";

const chartConfig = {
  desktop: {
    label: "day",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "order",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ChartLineDots(data: any) {
  const chartData = data.data.map((od: { date: string; count: string }) => {
    return {
      day: od.date,
      order: od.count,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Grafik Pesanan Harian</CardTitle>
        <CardDescription>Pesanan per Hari</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="w-full flex-1 min-h-[200px] max-h-[250px] lg:max-h-[250px] xl:max-h-[350px]"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(8, 10)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey="order"
              type="natural"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-desktop)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Pergerakan pesanan per hari
        </div>
        <div className="leading-none text-muted-foreground">
          Total pesanan dalam periode
        </div>
      </CardFooter>
    </Card>
  );
}
