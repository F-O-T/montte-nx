import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   type ChartConfig,
   ChartContainer,
   ChartLegend,
   ChartLegendContent,
   ChartTooltip,
   ChartTooltipContent,
} from "@packages/ui/components/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface CategoryBreakdown {
   category: string;
   income: number;
   expenses: number;
   total: number;
   transactionCount: number;
}

interface CategoryBreakdownChartProps {
   data: CategoryBreakdown[];
   title?: string;
   description?: string;
}

const getChartConfig = (): ChartConfig => ({
   expenses: {
      color: "#ef4444",
      label: translate("common.charts.labels.expenses"),
   },
   income: {
      color: "#10b981",
      label: translate("common.charts.labels.income"),
   },
});

export function CategoryBreakdownChart({
   data,
   title = "Breakdown by Category",
   description = "Income and expenses by category",
}: CategoryBreakdownChartProps) {
   const chartConfig = getChartConfig();

   return (
      <Card>
         <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
         </CardHeader>
         <CardContent>
            <ChartContainer className="h-[350px] w-full" config={chartConfig}>
               <BarChart accessibilityLayer data={data}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                     axisLine={false}
                     dataKey="category"
                     tickLine={false}
                     tickMargin={8}
                  />
                  <YAxis axisLine={false} tickLine={false} tickMargin={8} />
                  <ChartTooltip
                     content={
                        <ChartTooltipContent
                           formatter={(value: number) =>
                              `R$ ${value.toFixed(2)}`
                           }
                        />
                     }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                  <Bar
                     dataKey="expenses"
                     fill="var(--color-expenses)"
                     radius={4}
                  />
               </BarChart>
            </ChartContainer>
         </CardContent>
      </Card>
   );
}
