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
	income: {
		label: translate("common.charts.labels.income"),
		color: "#10b981",
	},
	expenses: {
		label: translate("common.charts.labels.expenses"),
		color: "#ef4444",
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
				<ChartContainer config={chartConfig} className="h-[350px] w-full">
					<BarChart accessibilityLayer data={data}>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="category"
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
						<Bar dataKey="income" fill="var(--color-income)" radius={4} />
						<Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
