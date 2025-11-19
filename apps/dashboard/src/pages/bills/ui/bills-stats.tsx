import { translate } from "@packages/localization";
import { StatsCard } from "@packages/ui/components/stats-card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";

type BillsStatsProps = {
	type?: "payable" | "receivable";
};

function BillsStatsErrorFallback(props: FallbackProps) {
	return (
		<div className="grid gap-4 h-min">
			{createErrorFallback({
				errorDescription: translate("dashboard.routes.bills.stats.error.description"),
				errorTitle: translate("dashboard.routes.bills.stats.error.title"),
				retryText: translate("common.form.retry"),
			})(props)}
		</div>
	);
}

function BillsStatsSkeleton() {
	return (
		<div className="grid gap-4 h-min">
			{[1, 2].map((index) => (
				<Card
					className="col-span-1 h-full w-full"
					key={`stats-skeleton-card-${index + 1}`}
				>
					<CardHeader>
						<CardTitle>
							<Skeleton className="h-6 w-24" />
						</CardTitle>
						<CardDescription>
							<Skeleton className="h-4 w-32" />
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Skeleton className="h-10 w-16" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function BillsStatsContent({ type }: BillsStatsProps) {
	const { data: stats } = useSuspenseQuery(trpc.bills.getStats.queryOptions());

	if (type === "payable") {
		return (
			<div className="grid gap-4 h-min">
				<StatsCard
					description={translate("dashboard.routes.bills.stats.pendingPayables")}
					title={translate("dashboard.routes.bills.stats.totalPayables.title")}
					value={`R$ ${stats?.totalPendingPayables?.toFixed(2) || "0.00"}`}
				/>
				<StatsCard
					description={translate("dashboard.routes.bills.stats.overdue")}
					title={translate("dashboard.routes.bills.stats.overduePayables.title")}
					value={stats?.totalOverduePayables || 0}
				/>
			</div>
		);
	}

	if (type === "receivable") {
		return (
			<div className="grid gap-4 h-min">
				<StatsCard
					description={translate(
						"dashboard.routes.bills.stats.pendingReceivables",
					)}
					title={translate("dashboard.routes.bills.stats.totalReceivables.title")}
					value={`R$ ${stats?.totalPendingReceivables?.toFixed(2) || "0.00"}`}
				/>
				<StatsCard
					description={translate("dashboard.routes.bills.stats.overdue")}
					title={translate("dashboard.routes.bills.stats.overdueReceivables.title")}
					value={stats?.totalOverdueReceivables || 0}
				/>
			</div>
		);
	}

	// Unified view - show all stats
	return (
		<div className="grid gap-4 h-min">
			<StatsCard
				description={translate("dashboard.routes.bills.stats.totalPayables")}
				title={translate("dashboard.routes.bills.stats.payables.title")}
				value={`R$ ${stats?.totalPendingPayables?.toFixed(2) || "0.00"}`}
			/>
			<StatsCard
				description={translate("dashboard.routes.bills.stats.totalReceivables")}
				title={translate("dashboard.routes.bills.stats.receivables.title")}
				value={`R$ ${stats?.totalPendingReceivables?.toFixed(2) || "0.00"}`}
			/>
			<StatsCard
				description={translate("dashboard.routes.bills.stats.totalOverdue")}
				title={translate("dashboard.routes.bills.stats.overdueBills.title")}
				value={(stats?.totalOverduePayables || 0) + (stats?.totalOverdueReceivables || 0)}
			/>
		</div>
	);
}

export function BillsStats({ type }: BillsStatsProps) {
	return (
		<ErrorBoundary FallbackComponent={BillsStatsErrorFallback}>
			<Suspense fallback={<BillsStatsSkeleton />}>
				<BillsStatsContent type={type} />
			</Suspense>
		</ErrorBoundary>
	);
}
