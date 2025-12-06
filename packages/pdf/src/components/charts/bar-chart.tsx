import { G, Line, Rect, Svg, Text } from "@react-pdf/renderer";

type BarChartProps = {
   width: number;
   height: number;
   data: Array<{
      label: string;
      income: number;
      expenses: number;
   }>;
};

const INCOME_COLOR = "#22c55e";
const EXPENSE_COLOR = "#ef4444";
const GRID_COLOR = "#e5e7eb";
const TEXT_COLOR = "#374151";

export function BarChart({ width, height, data }: BarChartProps) {
   const padding = { bottom: 40, left: 60, right: 20, top: 20 };
   const chartWidth = width - padding.left - padding.right;
   const chartHeight = height - padding.top - padding.bottom;

   const maxValue = Math.max(...data.flatMap((d) => [d.income, d.expenses]), 1);

   const barGroupWidth = chartWidth / data.length;
   const barWidth = barGroupWidth * 0.35;
   const barGap = barGroupWidth * 0.1;

   const formatValue = (value: number) => {
      if (value >= 1000000) {
         return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
         return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toFixed(0);
   };

   const gridLines = 5;
   const gridLinePositions = Array.from({ length: gridLines + 1 }, (_, i) => ({
      value: (i * maxValue) / gridLines,
      y: chartHeight - (i * chartHeight) / gridLines,
   }));

   return (
      <Svg height={height} width={width}>
         <G>
            {gridLinePositions.map((line, index) => (
               <G key={`grid-${index}`}>
                  <Line
                     stroke={GRID_COLOR}
                     strokeWidth={1}
                     x1={padding.left}
                     x2={width - padding.right}
                     y1={padding.top + line.y}
                     y2={padding.top + line.y}
                  />
                  <Text
                     style={{
                        fill: TEXT_COLOR,
                        fontSize: 8,
                        textAnchor: "end",
                     }}
                     x={padding.left - 5}
                     y={padding.top + line.y + 3}
                  >
                     {formatValue(line.value)}
                  </Text>
               </G>
            ))}
         </G>

         <G>
            {data.map((item, index) => {
               const groupX = padding.left + index * barGroupWidth;
               const incomeHeight = (item.income / maxValue) * chartHeight;
               const expenseHeight = (item.expenses / maxValue) * chartHeight;

               return (
                  <G key={`bar-group-${index}`}>
                     <Rect
                        fill={INCOME_COLOR}
                        height={incomeHeight}
                        width={barWidth}
                        x={groupX + barGap}
                        y={padding.top + chartHeight - incomeHeight}
                     />

                     <Rect
                        fill={EXPENSE_COLOR}
                        height={expenseHeight}
                        width={barWidth}
                        x={groupX + barGap + barWidth + barGap / 2}
                        y={padding.top + chartHeight - expenseHeight}
                     />

                     <Text
                        style={{
                           fill: TEXT_COLOR,
                           fontSize: 8,
                           textAnchor: "middle",
                        }}
                        x={groupX + barGroupWidth / 2}
                        y={height - padding.bottom + 15}
                     >
                        {item.label}
                     </Text>
                  </G>
               );
            })}
         </G>

         <G>
            <Rect
               fill={INCOME_COLOR}
               height={10}
               width={10}
               x={width - 100}
               y={5}
            />
            <Text
               style={{ fill: TEXT_COLOR, fontSize: 8 }}
               x={width - 85}
               y={13}
            >
               Receitas
            </Text>
            <Rect
               fill={EXPENSE_COLOR}
               height={10}
               width={10}
               x={width - 100}
               y={20}
            />
            <Text
               style={{ fill: TEXT_COLOR, fontSize: 8 }}
               x={width - 85}
               y={28}
            >
               Despesas
            </Text>
         </G>
      </Svg>
   );
}
