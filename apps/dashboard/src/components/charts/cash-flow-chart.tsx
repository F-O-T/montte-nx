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
	plannedNet: {
		label: translate("common.charts.labels.planned-net"),
		color: "#3b82f6",
	},
	actualNet: {
		label: translate("common.charts.labels.actual-net"),
		color: "#10b981",
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
		plannedNet: item.plannedIncome - item.plannedExpenses,
		actualNet: item.actualIncome - item.actualExpenses,
	}));

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[350px] w-full">
					<LineChart accessibilityLayer data={chartData}>
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
						<Line
							type="monotone"
							dataKey="plannedNet"
							stroke="var(--color-plannedNet)"
							strokeDasharray="5 5"
							strokeWidth={2}
							dot={false}
						/>
						<Line
							type="monotone"
							dataKey="actualNet"
							stroke="var(--color-actualNet)"
							strokeWidth={2}
							dot={false}
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
