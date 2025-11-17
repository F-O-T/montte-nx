import { createFileRoute } from "@tanstack/react-router";
import { PayablesPage } from "@/pages/bills/ui/payables-page";

export const Route = createFileRoute("/_dashboard/bills/payables")({
	component: PayablesPage,
});
