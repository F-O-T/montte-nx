import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@packages/ui/components/card";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	type ChartConfig,
} from "@packages/ui/components/chart";
import { translate } from "@packages/localization";
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
	actualIncome: {
		label: translate("common.charts.labels.income"),
		color: "#10b981",
	},
	actualExpenses: {
		label: translate("common.charts.labels.expenses"),
		color: "#ef4444",
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
				<ChartContainer config={chartConfig} className="h-[350px] w-full">
					<AreaChart accessibilityLayer data={data}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
						/>
						<YAxis tickLine={false} axisLine={false} tickMargin={8} />
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value: number) => `R$ ${value.toFixed(2)}`}
								/>
							}
						/>
						<ChartLegend content={<ChartLegendContent />} />
						<Area
							type="monotone"
							dataKey="actualIncome"
							stackId="1"
							stroke="var(--color-actualIncome)"
							fill="var(--color-actualIncome)"
							fillOpacity={0.6}
						/>
						<Area
							type="monotone"
							dataKey="actualExpenses"
							stackId="2"
							stroke="var(--color-actualExpenses)"
							fill="var(--color-actualExpenses)"
							fillOpacity={0.6}
						/>
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
