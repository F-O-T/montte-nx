import { translate } from "@packages/localization";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@packages/ui/components/alert-dialog";
import { Button } from "@packages/ui/components/button";
import { DatePicker } from "@packages/ui/components/date-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@packages/ui/components/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/integrations/clients";
import type { Bill } from "@packages/database/repositories/bill-repository";

interface CompleteBillDialogProps {
	bill: Bill;
	children: React.ReactNode;
}

export function CompleteBillDialog({ bill, children }: CompleteBillDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [completionDate, setCompletionDate] = useState(new Date());
	const [bankAccountId, setBankAccountId] = useState(
		bill.bankAccountId || undefined,
	);
	const queryClient = useQueryClient();

	const { data: bankAccounts = [] } = useQuery(
		trpc.bankAccounts.getAll.queryOptions(),
	);

	const activeBankAccounts = bankAccounts.filter(
		(account) => account.status === "active",
	);

	const completeBillMutation = useMutation(
		trpc.bills.complete.mutationOptions({
			onError: (error) => {
				toast.error(
					error.message || translate("dashboard.routes.bills.complete.error"),
				);
			},
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: trpc.bills.getAll.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.bills.getStats.queryKey(),
				});
				queryClient.invalidateQueries({
					queryKey: trpc.transactions.getAll.queryKey(),
				});
				toast.success(translate("dashboard.routes.bills.complete.success"));
				setIsOpen(false);
			},
		}),
	);

	const handleComplete = async () => {
		try {
			await completeBillMutation.mutateAsync({
				data: {
					bankAccountId,
					completionDate: completionDate.toISOString().split("T")[0],
				},
				id: bill.id,
			});
		} catch (error) {
			console.error("Failed to complete bill:", error);
		}
	};

	const actionText =
		bill.type === "expense"
			? translate("dashboard.routes.bills.actions.markAsPaid")
			: translate("dashboard.routes.bills.actions.markAsReceived");

	return (
		<AlertDialog onOpenChange={setIsOpen} open={isOpen}>
			<div onClick={() => setIsOpen(true)}>{children}</div>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{translate("dashboard.routes.bills.complete.title")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{translate("dashboard.routes.bills.complete.description", {
							description: bill.description,
						})}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<label className="text-sm font-medium">
							{translate("dashboard.routes.bills.complete.fields.completionDate")}
						</label>
						<DatePicker
							date={completionDate}
							onSelect={(date) => setCompletionDate(date || new Date())}
							placeholder={translate(
								"dashboard.routes.bills.complete.placeholders.completionDate",
							)}
						/>
					</div>

					<div className="grid gap-2">
						<label className="text-sm font-medium">
							{translate("dashboard.routes.bills.complete.fields.bankAccount")}
						</label>
						<Select onValueChange={setBankAccountId} value={bankAccountId}>
							<SelectTrigger>
								<SelectValue
									placeholder={translate(
										"dashboard.routes.bills.complete.placeholders.bankAccount",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								{activeBankAccounts.map((account) => (
									<SelectItem key={account.id} value={account.id}>
										{account.name} - {account.bank}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<p className="text-sm text-muted-foreground">
						{translate("dashboard.routes.bills.complete.info")}
					</p>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel>
						{translate("dashboard.routes.bills.complete.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						disabled={completeBillMutation.isPending}
						onClick={(e) => {
							e.preventDefault();
							handleComplete();
						}}
					>
						{completeBillMutation.isPending
							? translate("dashboard.routes.bills.complete.completing")
							: translate("dashboard.routes.bills.complete.confirm")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
