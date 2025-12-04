import { createFileRoute } from "@tanstack/react-router";
import { BillDetailsPage } from "@/pages/bill-details/ui/bill-details-page";

export const Route = createFileRoute("/$slug/_dashboard/bills/$billId")({
   component: RouteComponent,
});

function RouteComponent() {
   return <BillDetailsPage />;
}
