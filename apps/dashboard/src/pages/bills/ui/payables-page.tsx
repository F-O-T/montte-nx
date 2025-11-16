import { BillsListSection } from "./bills-list-section";
import { BillsQuickActionsToolbar } from "./bills-quick-actions-toolbar";
import { BillsStats } from "./bills-stats";

export function PayablesPage() {
	return (
		<main className="grid md:grid-cols-3 gap-4">
			<div className="col-span-1 md:col-span-2 grid gap-4">
				<BillsQuickActionsToolbar type="payable" />
				<BillsListSection type="payable" />
			</div>
			<BillsStats type="payable" />
		</main>
	);
}
