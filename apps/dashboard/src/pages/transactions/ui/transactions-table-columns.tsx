import type { ColumnDef } from "@tanstack/react-table";
import { translate } from "@packages/localization";
import { formatDecimalCurrency } from "@packages/utils/money";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Suspense } from "react";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import type { Category } from "@/pages/categories/ui/categories-page";
import type { Transaction } from "@/features/transaction/ui/transaction-item";
import { DeleteTransaction } from "@/features/transaction/features/delete-transaction-dialog";
import { ManageTransactionSheet } from "@/features/transaction/features/manage-transaction-sheet";

export function createTransactionColumns(
	categories: Category[],
): ColumnDef<Transaction>[] {
	return [
		{
			accessorKey: "description",
			enableSorting: true,
			header: translate(
				"dashboard.routes.transactions.table.columns.description",
			),
			cell: ({ row }) => {
				const transaction = row.original;
				const transactionCategoryIds = transaction.categoryIds;
				const primaryCategoryId = transactionCategoryIds[0];
				const categoryDetails = categories.find(
					(cat) => cat.id === primaryCategoryId,
				);
				const categoryColor = categoryDetails?.color || "#6b7280";
				const categoryIcon = categoryDetails?.icon || "Wallet";

				return (
					<div className="flex items-center gap-3">
						<div
							className="size-8 rounded-sm flex items-center justify-center"
							style={{
								backgroundColor: categoryColor,
							}}
						>
							<IconDisplay iconName={categoryIcon as IconName} size={16} />
						</div>
						<div className="flex flex-col">
							<span className="font-medium">{transaction.description}</span>
							<span className="text-xs text-muted-foreground">
								{categoryDetails?.name || "Sem categoria"}
							</span>
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: "date",
			enableSorting: true,
			header: translate("dashboard.routes.transactions.table.columns.date"),
			cell: ({ row }) => {
				return new Date(row.getValue("date")).toLocaleDateString("pt-BR", {
					day: "2-digit",
					month: "short",
					year: "numeric",
				});
			},
		},
		{
			accessorKey: "type",
			enableSorting: true,
			header: translate("dashboard.routes.transactions.table.columns.type"),
			cell: ({ row }) => {
				const type = row.getValue("type") as string;
				const typeMap = {
					income: "Receita",
					expense: "Despesa",
					transfer: "Transferência",
				};
				return <span>{typeMap[type as keyof typeof typeMap]}</span>;
			},
		},
		{
			accessorKey: "amount",
			enableSorting: true,
			header: () => (
				<div className="text-right">
					{translate("dashboard.routes.transactions.table.columns.amount")}
				</div>
			),
			cell: ({ row }) => {
				const transaction = row.original;
				const amount = Number.parseFloat(transaction.amount);
				const isPositive =
					transaction.type === "income" ||
					(transaction.type === "transfer" && amount > 0);
				const formattedAmount = formatDecimalCurrency(Math.abs(amount));

				return (
					<div className="text-right">
						<Badge variant={isPositive ? "default" : "destructive"}>
							{isPositive ? "+" : "-"}
							{formattedAmount}
						</Badge>
					</div>
				);
			},
		},
		{
			id: "actions",
			header: "",
			cell: ({ row }) => {
				const transaction = row.original;

				return (
					<div className="flex justify-end">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button aria-label="Actions" size="icon" variant="ghost">
									<MoreVertical className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>
									{translate(
										"dashboard.routes.transactions.list-section.actions.label",
									)}
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<Suspense
									fallback={
										<DropdownMenuItem disabled>Loading...</DropdownMenuItem>
									}
								>
									<ManageTransactionSheet asChild transaction={transaction} />
									<DeleteTransaction asChild transaction={transaction} />
								</Suspense>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				);
			},
		},
	];
}
