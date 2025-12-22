import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@packages/ui/components/empty";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemGroup,
	ItemSeparator,
	ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, Receipt, SplitSquareHorizontal } from "lucide-react";
import { Fragment, Suspense, useState } from "react";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { formatCurrency } from "../lib/split-calculator";
import { CreateExpenseSplitForm } from "./create-expense-split-form";
import { ExpenseSplitCredenza } from "./expense-split-credenza";

interface TeamExpenseSplitsCardProps {
	teamId: string;
}

const STATUS_COLORS = {
	active: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
	settled: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

function TeamExpenseSplitsContent({ teamId }: { teamId: string }) {
	const trpc = useTRPC();
	const { openSheet } = useSheet();
	const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);

	const { data: splits } = useSuspenseQuery(
		trpc.expenseSplits.getByTeam.queryOptions({ teamId }),
	);

	const handleCreateSplit = () => {
		openSheet({
			children: <CreateExpenseSplitForm teamId={teamId} />,
		});
	};

	if (splits.length === 0) {
		return (
			<Empty>
				<EmptyContent>
					<EmptyMedia variant="icon">
						<SplitSquareHorizontal className="size-8 text-muted-foreground" />
					</EmptyMedia>
					<EmptyTitle>No expense splits yet</EmptyTitle>
					<EmptyDescription>
						Create your first expense split to track shared expenses
					</EmptyDescription>
					<Button className="mt-4" size="sm" onClick={handleCreateSplit}>
						<Plus className="size-4 mr-2" />
						Create Split
					</Button>
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<>
			<ItemGroup>
				{splits.map((split, index) => {
					const totalSettled = split.participants.reduce(
						(sum, p) => sum + Number.parseFloat(p.settledAmount),
						0,
					);
					const totalAmount = Number.parseFloat(split.totalAmount);
					const isFullySettled = totalSettled >= totalAmount;

					return (
						<Fragment key={split.id}>
							<Item
								className="cursor-pointer hover:bg-muted/50 transition-colors"
								onClick={() => setSelectedSplitId(split.id)}
							>
								<div className="p-2 rounded-lg bg-muted mr-3">
									<Receipt className="size-4 text-muted-foreground" />
								</div>
								<ItemContent>
									<div className="flex items-center gap-2">
										<ItemTitle>
											{split.description || "Expense Split"}
										</ItemTitle>
										<Badge
											variant="secondary"
											className={
												isFullySettled
													? STATUS_COLORS.settled
													: STATUS_COLORS.active
											}
										>
											{isFullySettled ? "Settled" : "Active"}
										</Badge>
									</div>
									<ItemDescription>
										{formatCurrency(totalSettled)} / {formatCurrency(totalAmount)}{" "}
										- {split.participants.length} participants
									</ItemDescription>
								</ItemContent>
							</Item>
							{index !== splits.length - 1 && <ItemSeparator />}
						</Fragment>
					);
				})}
			</ItemGroup>

			{selectedSplitId && (
				<ExpenseSplitCredenza
					splitId={selectedSplitId}
					open={!!selectedSplitId}
					onOpenChange={(open) => !open && setSelectedSplitId(null)}
				/>
			)}
		</>
	);
}

function TeamExpenseSplitsSkeleton() {
	return (
		<div className="space-y-3">
			{[1, 2, 3].map((i) => (
				<Skeleton key={`skeleton-${i}`} className="h-16" />
			))}
		</div>
	);
}

export function TeamExpenseSplitsCard({ teamId }: TeamExpenseSplitsCardProps) {
	const { openSheet } = useSheet();

	const handleCreateSplit = () => {
		openSheet({
			children: <CreateExpenseSplitForm teamId={teamId} />,
		});
	};

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Expense Splits</CardTitle>
					<CardDescription>Shared expenses for this team</CardDescription>
				</div>
				<Button size="sm" variant="outline" onClick={handleCreateSplit}>
					<Plus className="size-4 mr-2" />
					New Split
				</Button>
			</CardHeader>
			<CardContent>
				<Suspense fallback={<TeamExpenseSplitsSkeleton />}>
					<TeamExpenseSplitsContent teamId={teamId} />
				</Suspense>
			</CardContent>
		</Card>
	);
}
