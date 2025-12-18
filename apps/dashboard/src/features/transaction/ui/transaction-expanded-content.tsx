import {
	Announcement,
	AnnouncementTag,
	AnnouncementTitle,
} from "@packages/ui/components/announcement";
import { Badge } from "@packages/ui/components/badge";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useQuery } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { useTRPC } from "@/integrations/clients";
import { getAccountTypeIcon } from "../lib/account-icon";
import { AttachmentsAnnouncement } from "./attachments-announcement";
import { BankAccountAnnouncement } from "./bank-account-announcement";
import { CategoryAnnouncement } from "./category-announcement";
import { CostCenterAnnouncement } from "./cost-center-announcement";
import { TagBadges } from "./tag-badges";
import { TransactionActions } from "./transaction-actions";
import type { Category, Transaction } from "./transaction-list";

type CategorySplit = {
	categoryId: string;
	value: number;
	splitType: "amount";
};

type TransactionExpandedContentProps = {
	row: Row<Transaction>;
	categories: Category[];
	slug: string;
};

export function TransactionExpandedContent({
	row,
	categories,
	slug,
}: TransactionExpandedContentProps) {
	const trpc = useTRPC();
	const transaction = row.original;
	const tags = transaction.transactionTags || [];
	const categorySplits = transaction.categorySplits as CategorySplit[] | null;
	const hasSplit = categorySplits && categorySplits.length > 0;

	const isTransfer = transaction.type === "transfer";

	const { data: attachments = [] } = useQuery(
		trpc.transactions.getAttachments.queryOptions({
			transactionId: transaction.id,
		}),
	);

	const { data: transferLog } = useQuery({
		...trpc.transactions.getTransferLog.queryOptions({
			transactionId: transaction.id,
		}),
		enabled: isTransfer,
	});

	const formattedTags = tags.map((tt) => tt.tag);

	return (
		<div className="p-4 space-y-4">
			{(hasSplit ||
				tags.length > 0 ||
				transaction.costCenter ||
				transaction.bankAccount ||
				attachments.length > 0) && (
				<div className="flex flex-wrap items-center gap-2">
					{hasSplit && (
						<>
							{categorySplits.map((split) => {
								const cat = categories.find((c) => c.id === split.categoryId);
								if (!cat) return null;
								return (
									<CategoryAnnouncement
										category={cat}
										key={split.categoryId}
										subtitle={formatDecimalCurrency(split.value / 100)}
									/>
								);
							})}
							{(tags.length > 0 ||
								transaction.costCenter ||
								transaction.bankAccount ||
								attachments.length > 0) && (
								<div className="h-4 w-px bg-border" />
							)}
						</>
					)}

					{tags.length > 0 && (
						<>
							<TagBadges asLinks slug={slug} tags={formattedTags} />
							{(transaction.costCenter ||
								transaction.bankAccount ||
								attachments.length > 0) && (
								<div className="h-4 w-px bg-border" />
							)}
						</>
					)}

					{transaction.costCenter && (
						<>
							<CostCenterAnnouncement costCenter={transaction.costCenter} />
							{(transaction.bankAccount || attachments.length > 0) && (
								<div className="h-4 w-px bg-border" />
							)}
						</>
					)}

					{transaction.bankAccount && (
						<>
							<BankAccountAnnouncement bankAccount={transaction.bankAccount} />
							{attachments.length > 0 && (
								<div className="h-4 w-px bg-border" />
							)}
						</>
					)}

					{attachments.length > 0 && (
						<AttachmentsAnnouncement count={attachments.length} />
					)}
				</div>
			)}

			{isTransfer &&
				transferLog &&
				(() => {
					const amount = Number.parseFloat(transaction.amount);
					const isIncoming = amount > 0;
					const formattedAmount = formatDecimalCurrency(Math.abs(amount));
					const FromIcon = getAccountTypeIcon(
						transferLog.fromBankAccount?.type,
					);
					const ToIcon = getAccountTypeIcon(transferLog.toBankAccount?.type);

					return (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<ArrowLeftRight className="size-3.5 text-muted-foreground" />
								<p className="text-xs text-muted-foreground">Transferência</p>
								<Badge variant={isIncoming ? "default" : "destructive"}>
									{isIncoming ? "Entrada" : "Saída"}
								</Badge>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Announcement>
									<AnnouncementTag className="flex items-center gap-1.5">
										<FromIcon className="size-3.5" />
										{transferLog.fromBankAccount?.name}
									</AnnouncementTag>
									<AnnouncementTitle className="text-destructive">
										-{formattedAmount}
									</AnnouncementTitle>
								</Announcement>

								<ArrowRight className="size-4 text-muted-foreground" />

								<Announcement>
									<AnnouncementTag className="flex items-center gap-1.5">
										<ToIcon className="size-3.5" />
										{transferLog.toBankAccount?.name}
									</AnnouncementTag>
									<AnnouncementTitle className="text-green-600">
										+{formattedAmount}
									</AnnouncementTitle>
								</Announcement>
							</div>
						</div>
					);
				})()}

			<div className="pt-2 border-t">
				<TransactionActions
					showViewDetails
					slug={slug}
					transaction={transaction}
					variant="compact"
				/>
			</div>
		</div>
	);
}
