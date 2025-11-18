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
	Planned: {
		label: translate("common.charts.labels.planned"),
		color: "#3b82f6",
	},
	Actual: {
		label: translate("common.charts.labels.actual"),
		color: "#10b981",
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
			name: translate("common.charts.labels.income"),
			Planned: data.planned.income,
			Actual: data.actual.income,
		},
		{
			name: translate("common.charts.labels.expenses"),
			Planned: data.planned.expenses,
			Actual: data.actual.expenses,
		},
		{
			name: translate("common.charts.labels.net"),
			Planned: data.planned.total,
			Actual: data.actual.total,
		},
	];

	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-[350px] w-full">
					<BarChart accessibilityLayer data={chartData}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="name"
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
						<Bar dataKey="Planned" fill="var(--color-Planned)" radius={4} />
						<Bar dataKey="Actual" fill="var(--color-Actual)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
