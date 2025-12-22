import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Scale } from "lucide-react";
import { Suspense } from "react";
import { useTRPC } from "@/integrations/clients";
import { formatCurrency } from "../lib/split-calculator";

function MemberBalanceContent() {
	const trpc = useTRPC();

	const { data: balance } = useSuspenseQuery(
		trpc.expenseSplits.getMyBalance.queryOptions(),
	);

	const netBalance = balance.netBalance;
	const isPositive = netBalance > 0;
	const isNegative = netBalance < 0;

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
					<div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
						<ArrowUp className="size-4 text-red-600 dark:text-red-400" />
					</div>
					<div>
						<p className="text-sm text-muted-foreground">You Owe</p>
						<p className="text-lg font-semibold text-red-600 dark:text-red-400">
							{formatCurrency(balance.memberOwes)}
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
					<div className="p-2 rounded-full bg-green-100 dark:bg-green-900/50">
						<ArrowDown className="size-4 text-green-600 dark:text-green-400" />
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Owed to You</p>
						<p className="text-lg font-semibold text-green-600 dark:text-green-400">
							{formatCurrency(balance.owedToMember)}
						</p>
					</div>
				</div>
			</div>

			<div
				className={`flex items-center gap-3 p-4 rounded-lg ${
					isPositive
						? "bg-green-100 dark:bg-green-900/30"
						: isNegative
							? "bg-red-100 dark:bg-red-900/30"
							: "bg-gray-100 dark:bg-gray-800"
				}`}
			>
				<div
					className={`p-2 rounded-full ${
						isPositive
							? "bg-green-200 dark:bg-green-800"
							: isNegative
								? "bg-red-200 dark:bg-red-800"
								: "bg-gray-200 dark:bg-gray-700"
					}`}
				>
					<Scale
						className={`size-5 ${
							isPositive
								? "text-green-700 dark:text-green-300"
								: isNegative
									? "text-red-700 dark:text-red-300"
									: "text-gray-700 dark:text-gray-300"
						}`}
					/>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Net Balance</p>
					<p
						className={`text-xl font-bold ${
							isPositive
								? "text-green-700 dark:text-green-300"
								: isNegative
									? "text-red-700 dark:text-red-300"
									: "text-gray-700 dark:text-gray-300"
						}`}
					>
						{isPositive ? "+" : ""}
						{formatCurrency(netBalance)}
					</p>
				</div>
			</div>
		</div>
	);
}

function MemberBalanceSkeleton() {
	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<Skeleton className="h-20" />
				<Skeleton className="h-20" />
			</div>
			<Skeleton className="h-24" />
		</div>
	);
}

export function MemberBalanceCard() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>My Balance</CardTitle>
				<CardDescription>
					Your expense split balance in this organization
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Suspense fallback={<MemberBalanceSkeleton />}>
					<MemberBalanceContent />
				</Suspense>
			</CardContent>
		</Card>
	);
}
