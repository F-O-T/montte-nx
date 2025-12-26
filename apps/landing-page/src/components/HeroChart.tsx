import { formatCurrency } from "@packages/money";
import {
   type ChartConfig,
   ChartContainer,
   ChartTooltip,
   ChartTooltipContent,
} from "@packages/ui/components/chart";
import { Bar, ComposedChart, Line, XAxis } from "recharts";

const chartData = [
   { contaCorrente: 45000, month: "Jan", poupanca: 23531 },
   { contaCorrente: 45000, month: "Fev", poupanca: 23531 },
   { contaCorrente: 58000, month: "Mar", poupanca: 31692 },
   { contaCorrente: 58000, month: "Abr", poupanca: 31692 },
   { contaCorrente: 45000, month: "Mai", poupanca: 23531 },
   { contaCorrente: 42000, month: "Jun", poupanca: 22794 },
   { contaCorrente: 25000, month: "Jul", poupanca: 13626 },
   { contaCorrente: 25000, month: "Ago", poupanca: 13626 },
   { contaCorrente: 52000, month: "Set", poupanca: 27751 },
   { contaCorrente: 58000, month: "Out", poupanca: 31692 },
   { contaCorrente: 74000, month: "Nov", poupanca: 40617 },
   { contaCorrente: 82000, month: "Dez", poupanca: 42000 },
];

const chartConfig = {
   contaCorrente: {
      color: "var(--chart-2)",
      label: "Conta Corrente",
   },
   poupanca: {
      color: "var(--chart-1)",
      label: "Poupança",
   },
} satisfies ChartConfig;

export default function HeroChart() {
   return (
      <ChartContainer className="h-40 w-full" config={chartConfig}>
         <ComposedChart accessibilityLayer data={chartData}>
            <XAxis
               axisLine={false}
               dataKey="month"
               tick={{ fontSize: 12 }}
               tickFormatter={(value) => value.slice(0, 3)}
               tickLine={false}
               tickMargin={10}
            />
            <ChartTooltip
               content={
                  <ChartTooltipContent
                     formatter={(value, name, item) => (
                        <div className="flex w-full items-center justify-between gap-4">
                           <div className="flex items-center gap-2">
                              <div
                                 className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                 style={{
                                    backgroundColor: item.color,
                                 }}
                              />
                              <span className="text-muted-foreground">
                                 {chartConfig[name as keyof typeof chartConfig]
                                    ?.label || name}
                              </span>
                           </div>
                           <span className="font-mono font-medium tabular-nums">
                              {formatCurrency(value as number)}
                           </span>
                        </div>
                     )}
                     hideIndicator
                  />
               }
               cursor={{
                  fill: "color-mix(in oklab, var(--chart-2) 10%, transparent)",
               }}
            />
            <Bar
               dataKey="contaCorrente"
               fill={chartConfig.contaCorrente.color}
               radius={4}
               stackId="a"
            />
            <Bar
               dataKey="poupanca"
               fill={chartConfig.poupanca.color}
               radius={[4, 4, 0, 0]}
               stackId="a"
            />
            <Line
               activeDot={{
                  fill: "var(--chart-3)",
                  r: 5,
                  stroke: "var(--background)",
                  strokeWidth: 2,
               }}
               dataKey="contaCorrente"
               dot={false}
               stroke="var(--chart-2)"
               strokeWidth={2.5}
               tooltipType="none"
               type="monotone"
            />
         </ComposedChart>
      </ChartContainer>
   );
}
