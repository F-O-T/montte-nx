import { trpc } from "@/integrations/clients";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { CategoryBreakdownChart } from "@/components/charts/category-breakdown-chart";
import { FinancialSummaryChart } from "@/components/charts/financial-summary-chart";
import { PlannedVsActualChart } from "@/components/charts/planned-vs-actual-chart";
import { PeriodFilter } from "@/components/period-filter";
import { translate } from "@packages/localization";
import { StatsCard } from "@packages/ui/components/stats-card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@packages/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@packages/ui/components/tabs";

function ReportsPageErrorFallback(props: FallbackProps) {
	return createErrorFallback({
		errorDescription: "Failed to load financial reports. Please try again later.",
		errorTitle: "Error loading reports",
		retryText: "Retry",
	})(props);
}

function ReportsPageSkeleton() {
	return (
		<div className="space-y-6">
			<Skeleton className="h-12" />
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-32" />
				))}
			</div>
			<Skeleton className="h-[500px]" />
		</div>
	);
}

function getCurrentMonthDates() {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
	return { start, end };
}

function ReportsPageContent() {
	const initialDates = getCurrentMonthDates();
	const [startDate, setStartDate] = useState<Date>(initialDates.start);
	const [endDate, setEndDate] = useState<Date>(initialDates.end);

	const handlePeriodChange = (start: Date, end: Date) => {
		setStartDate(start);
		setEndDate(end);
	};

	const { data: summary } = useSuspenseQuery(
		trpc.reports.getFinancialSummary.queryOptions({
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
		}),
	);

	const { data: cashFlow } = useSuspenseQuery(
		trpc.reports.getCashFlow.queryOptions({
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
			groupBy: "day",
		}),
	);

	const { data: plannedVsActual } = useSuspenseQuery(
		trpc.reports.getPlannedVsActual.queryOptions({
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
		}),
	);

	const { data: categoryBreakdown } = useSuspenseQuery(
		trpc.reports.getCategoryBreakdown.queryOptions({
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
		}),
	);

	const { data: performance } = useSuspenseQuery(
		trpc.reports.getPaymentPerformance.queryOptions({
			startDate: startDate.toISOString(),
			endDate: endDate.toISOString(),
		}),
	);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">
					{translate("dashboard.routes.reports.title")}
				</h2>
				<p className="text-muted-foreground">
					{translate("dashboard.routes.reports.description")}
				</p>
			</div>

			<PeriodFilter onPeriodChange={handlePeriodChange} />

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<StatsCard
					title={translate("dashboard.routes.reports.financial-summary.total-income.title")}
					value={`R$ ${summary.totalIncome.toFixed(2)}`}
					description={translate("dashboard.routes.reports.financial-summary.total-income.description")}
				/>
				<StatsCard
					title={translate("dashboard.routes.reports.financial-summary.total-expenses.title")}
					value={`R$ ${summary.totalExpenses.toFixed(2)}`}
					description={translate("dashboard.routes.reports.financial-summary.total-expenses.description")}
				/>
				<StatsCard
					title={translate("dashboard.routes.reports.financial-summary.net-balance.title")}
					value={`R$ ${summary.netBalance.toFixed(2)}`}
					description={translate("dashboard.routes.reports.financial-summary.net-balance.description")}
				/>
				<StatsCard
					title={translate("dashboard.routes.reports.financial-summary.transactions.title")}
					value={summary.totalTransactions}
					description={translate("dashboard.routes.reports.financial-summary.transactions.description")}
				/>
			</div>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">{translate("dashboard.routes.reports.tabs.overview")}</TabsTrigger>
					<TabsTrigger value="cashflow">{translate("dashboard.routes.reports.tabs.cashflow")}</TabsTrigger>
					<TabsTrigger value="categories">{translate("dashboard.routes.reports.tabs.categories")}</TabsTrigger>
					<TabsTrigger value="performance">{translate("dashboard.routes.reports.tabs.performance")}</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4">
						<FinancialSummaryChart
							data={cashFlow}
							title={translate("dashboard.routes.reports.charts.financial-evolution.title")}
							description={translate("dashboard.routes.reports.charts.financial-evolution.description")}
						/>
						<div className="grid gap-4 md:grid-cols-2">
							<PlannedVsActualChart
								data={plannedVsActual}
								title={translate("dashboard.routes.reports.charts.budget-compliance.title")}
								description={translate("dashboard.routes.reports.charts.budget-compliance.description")}
							/>
							<CategoryBreakdownChart
								data={categoryBreakdown}
								title={translate("dashboard.routes.reports.charts.category-overview.title")}
								description={translate("dashboard.routes.reports.charts.category-overview.description")}
							/>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="cashflow" className="space-y-4">
					<CashFlowChart
						data={cashFlow}
						title={translate("dashboard.routes.reports.charts.cash-flow-analysis.title")}
						description={translate("dashboard.routes.reports.charts.cash-flow-analysis.description")}
					/>
					<div className="grid gap-4 md:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle>{translate("dashboard.routes.reports.planned-vs-actual.planned-income.title")}</CardTitle>
								<CardDescription>{translate("dashboard.routes.reports.planned-vs-actual.planned-income.description")}</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold">
									R$ {plannedVsActual.planned.income.toFixed(2)}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>{translate("dashboard.routes.reports.planned-vs-actual.actual-income.title")}</CardTitle>
								<CardDescription>{translate("dashboard.routes.reports.planned-vs-actual.actual-income.description")}</CardDescription>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold">
									R$ {plannedVsActual.actual.income.toFixed(2)}
								</p>
								<p className={`text-sm ${plannedVsActual.variance.income >= 0 ? "text-green-600" : "text-red-600"}`}>
									{plannedVsActual.variance.income >= 0 ? "+" : ""}
									{plannedVsActual.variance.income.toFixed(2)} {translate("dashboard.routes.reports.planned-vs-actual.variance")}
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>{translate("dashboard.routes.reports.planned-vs-actual.income-variance.title")}</CardTitle>
								<CardDescription>{translate("dashboard.routes.reports.planned-vs-actual.income-variance.description")}</CardDescription>
							</CardHeader>
							<CardContent>
								<p className={`text-2xl font-bold ${plannedVsActual.variance.income >= 0 ? "text-green-600" : "text-red-600"}`}>
									{plannedVsActual.variance.income >= 0 ? "+" : ""}
									{((plannedVsActual.variance.income / plannedVsActual.planned.income) * 100).toFixed(1)}%
								</p>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="categories" className="space-y-4">
					<CategoryBreakdownChart
						data={categoryBreakdown}
						title={translate("dashboard.routes.reports.charts.category-analysis.title")}
						description={translate("dashboard.routes.reports.charts.category-analysis.description")}
					/>
					<Card>
						<CardHeader>
							<CardTitle>{translate("dashboard.routes.reports.category-details.title")}</CardTitle>
							<CardDescription>{translate("dashboard.routes.reports.category-details.description")}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{categoryBreakdown.map((cat) => (
									<div key={cat.category} className="flex items-center justify-between border-b pb-2">
										<div>
											<p className="font-medium">{cat.category}</p>
											<p className="text-sm text-muted-foreground">
												{cat.transactionCount} {translate("dashboard.routes.reports.category-details.transactions")}
											</p>
										</div>
										<div className="text-right">
											<p className="font-medium">
												R$ {Math.abs(cat.total).toFixed(2)}
											</p>
											<div className="flex gap-2 text-sm">
												<span className="text-green-600">
													+{cat.income.toFixed(2)}
												</span>
												<span className="text-red-600">
													-{cat.expenses.toFixed(2)}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="performance" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<StatsCard
							title={translate("dashboard.routes.reports.payment-performance.total-bills.title")}
							value={performance.totalBills}
							description={translate("dashboard.routes.reports.payment-performance.total-bills.description")}
						/>
						<StatsCard
							title={translate("dashboard.routes.reports.payment-performance.payment-rate.title")}
							value={`${performance.paymentRate.toFixed(1)}%`}
							description={`${performance.paidOnTime + performance.paidLate} ${translate("dashboard.routes.reports.payment-performance.payment-rate.description")}`}
						/>
						<StatsCard
							title={translate("dashboard.routes.reports.payment-performance.on-time-rate.title")}
							value={`${performance.onTimeRate.toFixed(1)}%`}
							description={`${performance.paidOnTime} ${translate("dashboard.routes.reports.payment-performance.on-time-rate.description")}`}
						/>
						<StatsCard
							title={translate("dashboard.routes.reports.payment-performance.overdue-bills.title")}
							value={performance.overdue}
							description={translate("dashboard.routes.reports.payment-performance.overdue-bills.description")}
						/>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>{translate("dashboard.routes.reports.payment-performance.payment-status.title")}</CardTitle>
								<CardDescription>{translate("dashboard.routes.reports.payment-performance.payment-status.description")}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm">{translate("dashboard.routes.reports.payment-performance.paid-on-time")}</span>
										<span className="font-medium text-green-600">
											{performance.paidOnTime}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">{translate("dashboard.routes.reports.payment-performance.paid-late")}</span>
										<span className="font-medium text-yellow-600">
											{performance.paidLate}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">{translate("dashboard.routes.reports.payment-performance.pending")}</span>
										<span className="font-medium text-blue-600">
											{performance.pending}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">{translate("dashboard.routes.reports.payment-performance.overdue")}</span>
										<span className="font-medium text-red-600">
											{performance.overdue}
										</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>{translate("dashboard.routes.reports.payment-performance.performance-metrics.title")}</CardTitle>
								<CardDescription>{translate("dashboard.routes.reports.payment-performance.performance-metrics.description")}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm">{translate("dashboard.routes.reports.payment-performance.avg-delay")}</span>
										<span className="font-medium">
											{performance.averageDelayDays.toFixed(1)} {translate("dashboard.routes.reports.payment-performance.days")}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">{translate("dashboard.routes.reports.payment-performance.payment-completion")}</span>
										<span className="font-medium">
											{performance.paymentRate.toFixed(1)}%
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-sm">{translate("dashboard.routes.reports.payment-performance.on-time-compliance")}</span>
										<span className="font-medium">
											{performance.onTimeRate.toFixed(1)}%
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

export function ReportsPage() {
	return (
		<ErrorBoundary FallbackComponent={ReportsPageErrorFallback}>
			<Suspense fallback={<ReportsPageSkeleton />}>
				<ReportsPageContent />
			</Suspense>
		</ErrorBoundary>
	);
}
