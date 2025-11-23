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
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface CashFlowData {
   date: string;
   plannedIncome: number;
   plannedExpenses: number;
   actualIncome: number;
   actualExpenses: number;
}

interface CashFlowChartProps {
   data: CashFlowData[];
   title?: string;
   description?: string;
}

const getChartConfig = (): ChartConfig => ({
   actualNet: {
      color: "#10b981",
      label: translate("common.charts.labels.actual-net"),
   },
   plannedNet: {
      color: "#3b82f6",
      label: translate("common.charts.labels.planned-net"),
   },
});

export function CashFlowChart({
   data,
   title = "Cash Flow",
   description = "Projected vs actual cash flow",
}: CashFlowChartProps) {
   const chartConfig = getChartConfig();

   const chartData = data.map((item) => ({
      ...item,
      actualNet: item.actualIncome - item.actualExpenses,
      plannedNet: item.plannedIncome - item.plannedExpenses,
   }));

   return (
      <Card>
         <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
         </CardHeader>
         <CardContent>
            <ChartContainer className="h-[350px] w-full" config={chartConfig}>
               <LineChart accessibilityLayer data={chartData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                     axisLine={false}
                     dataKey="date"
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
                  <Line
                     dataKey="plannedNet"
                     dot={false}
                     stroke="var(--color-plannedNet)"
                     strokeDasharray="5 5"
                     strokeWidth={2}
                     type="monotone"
                  />
                  <Line
                     dataKey="actualNet"
                     dot={false}
                     stroke="var(--color-actualNet)"
                     strokeWidth={2}
                     type="monotone"
                  />
               </LineChart>
            </ChartContainer>
         </CardContent>
      </Card>
   );
}
