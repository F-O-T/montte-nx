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
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface CashFlowData {
   date: string;
   plannedIncome: number;
   plannedExpenses: number;
   actualIncome: number;
   actualExpenses: number;
}

interface FinancialSummaryChartProps {
   data: CashFlowData[];
   title?: string;
   description?: string;
}

const getChartConfig = (): ChartConfig => ({
   actualExpenses: {
      color: "#ef4444",
      label: translate("common.charts.labels.expenses"),
   },
   actualIncome: {
      color: "#10b981",
      label: translate("common.charts.labels.income"),
   },
});

export function FinancialSummaryChart({
   data,
   title = "Financial Evolution",
   description = "Income vs Expenses over time",
}: FinancialSummaryChartProps) {
   const chartConfig = getChartConfig();

   return (
      <Card>
         <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
         </CardHeader>
         <CardContent>
            <ChartContainer className="h-[350px] w-full" config={chartConfig}>
               <AreaChart accessibilityLayer data={data}>
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
                           formatter={(value) =>
                              `R$ ${Number(value).toFixed(2)}`
                           }
                        />
                     }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                     dataKey="actualIncome"
                     fill="var(--color-actualIncome)"
                     fillOpacity={0.6}
                     stackId="1"
                     stroke="var(--color-actualIncome)"
                     type="monotone"
                  />
                  <Area
                     dataKey="actualExpenses"
                     fill="var(--color-actualExpenses)"
                     fillOpacity={0.6}
                     stackId="2"
                     stroke="var(--color-actualExpenses)"
                     type="monotone"
                  />
               </AreaChart>
            </ChartContainer>
         </CardContent>
      </Card>
   );
}
