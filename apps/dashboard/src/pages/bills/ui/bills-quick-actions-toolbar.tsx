import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
	Item,
	ItemContent,
	ItemDescription,
	ItemTitle,
} from "@packages/ui/components/item";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { FilePlus } from "lucide-react";
import { useState } from "react";
import { AddBillSheet } from "../features/add-bill-sheet";

type BillsQuickActionsToolbarProps = {
	type?: "payable" | "receivable";
};

export function BillsQuickActionsToolbar({
	type,
}: BillsQuickActionsToolbarProps) {
	const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

	const title =
		type === "payable"
			? "Payables Actions"
			: type === "receivable"
				? "Receivables Actions"
				: "Bills Actions";

	const description =
		type === "payable"
			? translate("dashboard.routes.bills.payables.description")
			: type === "receivable"
				? translate("dashboard.routes.bills.receivables.description")
				: translate("dashboard.routes.bills.overview.description");

	return (
		<>
			<Item variant="outline">
				<ItemContent>
					<ItemTitle>{title}</ItemTitle>
					<ItemDescription>{description}</ItemDescription>
				</ItemContent>
				<div className="ml-auto">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								aria-label={translate("dashboard.routes.bills.addBill")}
								onClick={() => setIsCreateSheetOpen(true)}
								size="icon"
								variant="outline"
							>
								<FilePlus className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>{translate("dashboard.routes.bills.addBill")}</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</Item>

			<AddBillSheet
				onOpen={isCreateSheetOpen}
				onOpenChange={setIsCreateSheetOpen}
			/>
		</>
	);
}
