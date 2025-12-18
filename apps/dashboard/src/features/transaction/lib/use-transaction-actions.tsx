import type { RouterOutput } from "@packages/api/client";
import { useSheet } from "@/hooks/use-sheet";
import { CategorizeForm } from "../ui/categorize-form";
import { CategorySplitForm } from "../ui/category-split-form";
import { DuplicateTransactionSheet } from "../ui/duplicate-transaction-sheet";
import { LinkFileForm } from "../ui/link-file-form";
import { ManageTransactionForm } from "../ui/manage-transaction-form";
import { MarkAsTransferForm } from "../ui/mark-as-transfer-form";
import { RecurrenceTransactionSheet } from "../ui/recurrence-transaction-sheet";
import { RefundTransactionSheet } from "../ui/refund-transaction-sheet";
import { useDeleteTransaction } from "../ui/use-delete-transaction";

type Transaction =
	RouterOutput["transactions"]["getAllPaginated"]["transactions"][number];

type UseTransactionActionsOptions = {
	onDeleteSuccess?: () => void;
};

export function useTransactionActions(
	transaction: Transaction,
	options?: UseTransactionActionsOptions,
) {
	const { openSheet } = useSheet();
	const { deleteTransaction } = useDeleteTransaction({
		onSuccess: options?.onDeleteSuccess,
		transaction,
	});

	const handleDuplicate = () => {
		openSheet({
			children: (
				<DuplicateTransactionSheet
					transaction={{
						amount: transaction.amount,
						bankAccountId: transaction.bankAccountId,
						categoryIds:
							transaction.transactionCategories?.map((tc) => tc.category.id) ||
							[],
						costCenterId: transaction.costCenterId,
						date: new Date(transaction.date),
						description: transaction.description,
						tagIds:
							transaction.transactionTags?.map((tt) => tt.tag.id) || [],
						type: transaction.type as "expense" | "income" | "transfer",
					}}
				/>
			),
		});
	};

	const handleRefund = () => {
		openSheet({
			children: (
				<RefundTransactionSheet
					transaction={{
						amount: transaction.amount,
						bankAccountId: transaction.bankAccountId,
						categoryIds:
							transaction.transactionCategories?.map((tc) => tc.category.id) ||
							[],
						costCenterId: transaction.costCenterId,
						date: new Date(transaction.date),
						description: transaction.description,
						tagIds:
							transaction.transactionTags?.map((tt) => tt.tag.id) || [],
						type: transaction.type as "expense" | "income" | "transfer",
					}}
				/>
			),
		});
	};

	const handleCreateRecurrence = () => {
		const primaryCategoryId =
			transaction.transactionCategories?.[0]?.category.id;
		openSheet({
			children: (
				<RecurrenceTransactionSheet
					transaction={{
						amount: transaction.amount,
						bankAccountId: transaction.bankAccountId,
						categoryId: primaryCategoryId,
						description: transaction.description,
						type: transaction.type as "expense" | "income" | "transfer",
					}}
				/>
			),
		});
	};

	const handleEdit = () => {
		openSheet({
			children: <ManageTransactionForm transaction={transaction} />,
		});
	};

	const handleCategorize = () => {
		openSheet({
			children: <CategorizeForm transactions={[transaction]} />,
		});
	};

	const handleSplitCategories = () => {
		openSheet({
			children: <CategorySplitForm transaction={transaction} />,
		});
	};

	const handleMarkAsTransfer = () => {
		openSheet({
			children: <MarkAsTransferForm transactions={[transaction]} />,
		});
	};

	const handleLinkFile = () => {
		openSheet({
			children: <LinkFileForm transaction={transaction} />,
		});
	};

	return {
		handleCategorize,
		handleCreateRecurrence,
		handleDelete: deleteTransaction,
		handleDuplicate,
		handleEdit,
		handleLinkFile,
		handleMarkAsTransfer,
		handleRefund,
		handleSplitCategories,
	};
}
