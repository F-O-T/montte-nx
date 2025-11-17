import type { Bill } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { getRecurrenceLabel, type RecurrencePattern } from "@packages/utils/recurrence";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import { DatePicker } from "@packages/ui/components/date-picker";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@packages/ui/components/pagination";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/integrations/clients";
import { CompleteBillDialog } from "../features/complete-bill-dialog";
import { DeleteBillDialog } from "../features/delete-bill-dialog";
import { EditBillSheet } from "../features/edit-bill-sheet";

type BillsListSectionProps = {
	type?: "payable" | "receivable";
};

function BillsListContent({ type }: BillsListSectionProps) {
	const [editingBill, setEditingBill] = useState<Bill | null>(null);
	const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	const formattedMonth = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;

	const { data: paginatedData } = useSuspenseQuery(
		trpc.bills.getAllPaginated.queryOptions({
			limit: pageSize,
			month: formattedMonth,
			page: currentPage,
			type: type === "payable" ? "expense" : type === "receivable" ? "income" : undefined,
		}),
	);

	const { bills, pagination } = paginatedData;

	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const isOverdue = (bill: Bill) => {
		if (bill.completionDate) return false;
		const dueDate = bill.dueDate ? new Date(bill.dueDate) : null;
		if (!dueDate) return false;
		dueDate.setHours(0, 0, 0, 0);
		return dueDate < today;
	};

	const isPending = (bill: Bill) => {
		if (bill.completionDate) return false;
		return !isOverdue(bill);
	};

	const overdueBills = bills.filter((bill) => isOverdue(bill));
	const pendingBills = bills.filter((bill) => isPending(bill));
	const completedBills = bills.filter((bill) => bill.completionDate);

	const handleMonthChange = (date: Date | undefined) => {
		setSelectedMonth(date || new Date());
		setCurrentPage(1);
	};

	const renderBillItem = (bill: Bill, variant: "overdue" | "pending") => (
		<div
			key={bill.id}
			className={`flex items-center justify-between p-4 border rounded-lg ${
				variant === "overdue" ? "bg-destructive/5" : ""
			}`}
		>
			<div className="flex-1">
				<div className="flex items-center gap-2">
					<p className="font-medium">{bill.description}</p>
					{bill.isRecurring && bill.recurrencePattern && (
						<Badge variant="outline" className="text-xs">
							{getRecurrenceLabel(bill.recurrencePattern as RecurrencePattern)}
						</Badge>
					)}
				</div>
				<p className="text-sm text-muted-foreground">
					{translate("dashboard.routes.bills.dueDate")}:{" "}
					{bill.dueDate ? format(new Date(bill.dueDate), "dd/MM/yyyy") : "-"}
				</p>
			</div>
			<div className="flex items-center gap-4">
				<Badge
					variant={
						variant === "overdue"
							? "destructive"
							: bill.type === "expense"
								? "secondary"
								: "default"
					}
				>
					R$ {parseFloat(bill.amount).toFixed(2)}
				</Badge>
				<div className="flex items-center gap-2">
					<CompleteBillDialog bill={bill}>
						<Button size="sm" variant={variant === "overdue" ? "outline" : "default"}>
							{bill.type === "expense"
								? translate("dashboard.routes.bills.actions.pay")
								: translate("dashboard.routes.bills.actions.receive")}
						</Button>
					</CompleteBillDialog>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button size="sm" variant="ghost">
								<MoreVertical className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => setEditingBill(bill)}>
								<Pencil className="size-4 mr-2" />
								{translate("dashboard.routes.bills.actions.edit")}
							</DropdownMenuItem>
							<DeleteBillDialog bill={bill}>
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onSelect={(e) => e.preventDefault()}
								>
									<Trash2 className="size-4 mr-2" />
									{translate("dashboard.routes.bills.actions.delete")}
								</DropdownMenuItem>
							</DeleteBillDialog>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle>
								{type === "payable"
									? translate("dashboard.routes.bills.payables.title")
									: type === "receivable"
										? translate("dashboard.routes.bills.receivables.title")
										: translate("dashboard.routes.bills.allBills.title")}
							</CardTitle>
							<CardDescription>
								{type === "payable"
									? translate("dashboard.routes.bills.payables.description")
									: type === "receivable"
										? translate("dashboard.routes.bills.receivables.description")
										: translate("dashboard.routes.bills.allBills.description")}
							</CardDescription>
						</div>
						<DatePicker
							date={selectedMonth}
							onSelect={handleMonthChange}
							placeholder="Selecione o mês"
							className="w-[200px]"
						/>
					</div>
				</CardHeader>
				<CardContent>
					{overdueBills.length > 0 && (
						<div className="mb-6">
							<h3 className="font-semibold mb-2 text-destructive">
								{translate("dashboard.routes.bills.overdue")} (
								{overdueBills.length})
							</h3>
							<div className="space-y-2">
								{overdueBills.map((bill) => renderBillItem(bill, "overdue"))}
							</div>
						</div>
					)}

					{pendingBills.length > 0 && (
						<div className="mb-6">
							<h3 className="font-semibold mb-2">
								{translate("dashboard.routes.bills.pending")} (
								{pendingBills.length})
							</h3>
							<div className="space-y-2">
								{pendingBills.map((bill) => renderBillItem(bill, "pending"))}
							</div>
						</div>
					)}

					{completedBills.length > 0 && (
						<div>
							<h3 className="font-semibold mb-2">
								{translate("dashboard.routes.bills.completed")} (
								{completedBills.length})
							</h3>
							<div className="space-y-2">
								{completedBills.map((bill) => (
									<div
										key={bill.id}
										className="flex items-center justify-between p-4 border rounded-lg opacity-60"
									>
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<p className="font-medium">{bill.description}</p>
												{bill.isRecurring && bill.recurrencePattern && (
													<Badge variant="outline" className="text-xs">
														{getRecurrenceLabel(bill.recurrencePattern as RecurrencePattern)}
													</Badge>
												)}
											</div>
											<p className="text-sm text-muted-foreground">
												{translate("dashboard.routes.bills.completedOn")}:{" "}
												{bill.completionDate
													? format(new Date(bill.completionDate), "dd/MM/yyyy")
													: "-"}
											</p>
										</div>
										<Badge variant="outline">
											R$ {parseFloat(bill.amount).toFixed(2)}
										</Badge>
									</div>
								))}
							</div>
						</div>
					)}

					{bills.length === 0 && (
						<div className="text-center py-8 text-muted-foreground">
							{translate("dashboard.routes.bills.empty")}
						</div>
					)}
				</CardContent>

				{pagination.totalPages > 1 && (
					<CardFooter>
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										className={
											!pagination.hasPreviousPage
												? "pointer-events-none opacity-50"
												: ""
										}
										href="#"
										onClick={() =>
											setCurrentPage((prev) => {
												const newPage = prev - 1;
												return newPage >= 1 ? newPage : prev;
											})
										}
									/>
								</PaginationItem>

								{Array.from(
									{ length: Math.min(5, pagination.totalPages) },
									(_, i: number): number => {
										if (pagination.totalPages <= 5) {
											return i + 1;
										} else if (currentPage <= 3) {
											return i + 1;
										} else if (currentPage >= pagination.totalPages - 2) {
											return pagination.totalPages - 4 + i;
										} else {
											return currentPage - 2 + i;
										}
									},
								).map((pageNum) => (
									<PaginationItem key={pageNum}>
										<PaginationLink
											href="#"
											isActive={pageNum === currentPage}
											onClick={() => setCurrentPage(pageNum)}
										>
											{pageNum}
										</PaginationLink>
									</PaginationItem>
								))}

								<PaginationItem>
									<PaginationNext
										className={
											!pagination.hasNextPage
												? "pointer-events-none opacity-50"
												: ""
										}
										href="#"
										onClick={() =>
											setCurrentPage((prev) => {
												const newPage = prev + 1;
												return newPage <= pagination.totalPages ? newPage : prev;
											})
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</CardFooter>
				)}
			</Card>

			{editingBill && (
				<EditBillSheet
					bill={editingBill}
					onOpen={!!editingBill}
					onOpenChange={(open) => !open && setEditingBill(null)}
				/>
			)}
		</>
	);
}

export function BillsListSection({ type }: BillsListSectionProps) {
	return (
		<ErrorBoundary fallback={<div>Error loading bills</div>}>
			<Suspense fallback={<Skeleton className="h-96" />}>
				<BillsListContent type={type} />
			</Suspense>
		</ErrorBoundary>
	);
}
