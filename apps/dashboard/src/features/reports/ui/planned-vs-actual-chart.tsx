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

interface PlannedVsActual {
   planned: {
      income: number;
      expenses: number;
      total: number;
   };
   actual: {
      income: number;
      expenses: number;
      total: number;
   };
   variance: {
      income: number;
      expenses: number;
      total: number;
   };
}

interface PlannedVsActualChartProps {
   data: PlannedVsActual;
   title?: string;
   description?: string;
}

const getChartConfig = (): ChartConfig => ({
   Actual: {
      color: "#10b981",
      label: translate("common.charts.labels.actual"),
   },
   Planned: {
      color: "#3b82f6",
      label: translate("common.charts.labels.planned"),
   },
});

export function PlannedVsActualChart({
   data,
   title = "Planned vs Actual",
   description = "Comparison of planned and actual values",
}: PlannedVsActualChartProps) {
   const chartConfig = getChartConfig();

   const chartData = [
      {
         Actual: data.actual.income,
         name: translate("common.charts.labels.income"),
         Planned: data.planned.income,
      },
      {
         Actual: data.actual.expenses,
         name: translate("common.charts.labels.expenses"),
         Planned: data.planned.expenses,
      },
      {
         Actual: data.actual.total,
         name: translate("common.charts.labels.net"),
         Planned: data.planned.total,
      },
   ];

   return (
      <Card>
         <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
         </CardHeader>
         <CardContent>
            <ChartContainer className="h-[350px] w-full" config={chartConfig}>
               <BarChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                     axisLine={false}
                     dataKey="name"
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
                  <Bar
                     dataKey="Planned"
                     fill="var(--color-Planned)"
                     radius={4}
                  />
                  <Bar dataKey="Actual" fill="var(--color-Actual)" radius={4} />
               </BarChart>
            </ChartContainer>
         </CardContent>
      </Card>
   );
}
