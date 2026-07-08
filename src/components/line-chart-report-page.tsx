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
import { IconTrendingUp } from "@tabler/icons-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface DailySummary {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

const chartConfig = {
  revenue: {
    label: "Pendapatan",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ChartLineReport({ data }: { data: DailySummary[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tren Pendapatan Harian</CardTitle>
        <CardDescription>
          Total omzet per hari dalam periode yang dipilih
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="w-full flex-1 min-h-[200px] max-h-[250px] lg:max-h-[250px] xl:max-h-[350px]"
        >
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              right: 12,
              left: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
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
              type="natural"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={{
                fill: "white",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Total pendapatan selama periode ini{" "}
          <IconTrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Berdasarkan data transaksi harian
        </div>
      </CardFooter>
    </Card>
  );
}
