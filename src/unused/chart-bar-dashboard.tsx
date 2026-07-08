import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

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

export const description = "A mixed bar chart";

export function ChartBarMixed(data: any) {
  // const chartData = [
  //   { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  //   { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  //   { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  //   { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  //   { browser: "other", visitors: 90, fill: "var(--color-other)" },
  // ];
  const chartData = data.data.map(
    (od: { service_name: string; jumlah: string }) => {
      return {
        service_name: od.service_name,
        jumlah: od.jumlah,
      };
    },
  );
  console.log(chartData);
  // {
  //     "service_name": "Cuci Basah",
  //     "jumlah": 13
  // },
  // {
  //     "service_name": "Cuci Kering",
  //     "jumlah": 12
  // },
  // {
  //     "service_name": "Cuci Setrika",
  //     "jumlah": 11
  // },
  // {
  //     "service_name": "Setrika Saja",
  //     "jumlah": 14
  // },
  // {
  //     "service_name": "Handuk Besar",
  //     "jumlah": 8
  // },
  // {
  //     "service_name": "Handuk Sedang",
  //     "jumlah": 14
  // },
  // {
  //     "service_name": "Handuk Kecil",
  //     "jumlah": 9
  // },
  // {
  //     "service_name": "Selimut Besar",
  //     "jumlah": 8
  // },
  // {
  //     "service_name": "Selimut Kecil",
  //     "jumlah": 11
  // },
  // {
  //     "service_name": "Selimut Tebal",
  //     "jumlah": 10
  // },
  // {
  //     "service_name": "Bed Cover Big",
  //     "jumlah": 13
  // },
  // {
  //     "service_name": "Bed Cover Normal",
  //     "jumlah": 9
  // }

  const chartConfig = {
    jumlah: {
      label: "Total Order",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;
  // const chartConfig = {
  //   jumlah: {
  //     label: "jumlah",
  //   },
  //   service_name: {
  //     label: "Cuci Basah",
  //     color: "var(--chart-1)",
  //   },
  //   Cuci_Kering: {
  //     label: "Cuci Kering",
  //     color: "var(--chart-2)",
  //   },
  //   Cuci_Setrika: {
  //     label: "Cuci Setrika",
  //     color: "var(--chart-3)",
  //   },
  //   edge: {
  //     label: "Edge",
  //     color: "var(--chart-4)",
  //   },
  //   other: {
  //     label: "Other",
  //     color: "var(--chart-5)",
  //   },
  // } satisfies ChartConfig;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Mixed</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              dataKey="service_name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              // tickFormatter={(value) =>
              //   chartConfig[value as keyof typeof chartConfig]?.label
              // }
            />
            <XAxis dataKey="jumlah" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="jumlah" fill="var(--chart-1)" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
