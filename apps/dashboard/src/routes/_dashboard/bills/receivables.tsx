import { createFileRoute } from "@tanstack/react-router";
import { ReceivablesPage } from "@/pages/bills/ui/receivables-page";

export const Route = createFileRoute("/_dashboard/bills/receivables")({
	component: ReceivablesPage,
});
