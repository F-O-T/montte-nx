import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
	Choicebox,
	ChoiceboxIndicator,
	ChoiceboxItem,
	ChoiceboxItemDescription,
	ChoiceboxItemHeader,
	ChoiceboxItemTitle,
} from "@packages/ui/components/choicebox";
import { DatePicker } from "@packages/ui/components/date-picker";
import {
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@packages/ui/components/sheet";
import { formatDate } from "@packages/utils/date";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

type DuplicateTransactionSheetProps = {
	transaction: {
		amount: string;
		bankAccountId: string | null;
		categoryIds: string[];
		costCenterId: string | null;
		date: Date;
		description: string;
		tagIds: string[];
		type: "expense" | "income" | "transfer";
	};
};

type DateOption = "same-day" | "today" | "custom";

const dateOptions: DateOption[] = ["same-day", "today", "custom"];

export function DuplicateTransactionSheet({
	transaction,
}: DuplicateTransactionSheetProps) {
	const trpc = useTRPC();
	const { closeSheet } = useSheet();
	const [dateOption, setDateOption] = useState<DateOption>("today");
	const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

	const createTransactionMutation = useMutation(
		trpc.transactions.create.mutationOptions({
			onSuccess: () => {
				toast.success(
					translate(
						"dashboard.routes.transactions.notifications.create-success",
					),
				);
				closeSheet();
			},
			onError: (error) => {
				console.error("Failed to duplicate transaction:", error);
				toast.error(
					translate(
						"dashboard.routes.transactions.notifications.create-error",
					),
				);
			},
		}),
	);

	const getDuplicateDate = (): Date => {
		switch (dateOption) {
			case "same-day":
				return transaction.date;
			case "today":
				return new Date();
			case "custom":
				if (!customDate) {
					throw new Error(
						"Custom date is required when dateOption is 'custom'",
					);
				}
				return customDate;
		}
	};

	const handleSubmit = () => {
		const duplicateType =
			transaction.type === "transfer" ? "expense" : transaction.type;

		createTransactionMutation.mutate({
			amount: Number(transaction.amount),
			bankAccountId: transaction.bankAccountId || undefined,
			categoryIds: transaction.categoryIds,
			costCenterId: transaction.costCenterId || undefined,
			date: formatDate(getDuplicateDate(), "YYYY-MM-DD"),
			description: transaction.description,
			tagIds: transaction.tagIds,
			type: duplicateType,
		});
	};

	const isSubmitDisabled =
		createTransactionMutation.isPending ||
		(dateOption === "custom" && !customDate);

	return (
		<>
			<SheetHeader>
				<SheetTitle>
					{translate(
						"dashboard.routes.transactions.features.duplicate.title",
					)}
				</SheetTitle>
				<SheetDescription>
					{translate(
						"dashboard.routes.transactions.features.duplicate.description",
					)}
				</SheetDescription>
			</SheetHeader>

			<div className="px-4 flex-1 overflow-y-auto">
				<div className="space-y-4 py-4">
					<Choicebox
						value={dateOption}
						onValueChange={(value) => setDateOption(value as DateOption)}
					>
						{dateOptions.map((option) => (
							<ChoiceboxItem key={option} value={option} id={option}>
								<ChoiceboxItemHeader>
									<ChoiceboxItemTitle>
										{translate(
											`dashboard.routes.transactions.features.duplicate.date-options.${option}.title`,
										)}
									</ChoiceboxItemTitle>
									<ChoiceboxItemDescription>
										{translate(
											`dashboard.routes.transactions.features.duplicate.date-options.${option}.description`,
										)}
									</ChoiceboxItemDescription>
								</ChoiceboxItemHeader>
								<ChoiceboxIndicator id={option} />
							</ChoiceboxItem>
						))}
					</Choicebox>

					{dateOption === "custom" && (
						<DatePicker
							date={customDate}
							onSelect={setCustomDate}
							placeholder={translate(
								"dashboard.routes.transactions.features.duplicate.date-options.custom.title",
							)}
							className="w-full"
						/>
					)}
				</div>
			</div>

			<SheetFooter>
				<Button onClick={handleSubmit} disabled={isSubmitDisabled}>
					{createTransactionMutation.isPending
						? translate("common.actions.loading")
						: translate(
							"dashboard.routes.transactions.features.duplicate.submit",
						)}
				</Button>
			</SheetFooter>
		</>
	);
}
