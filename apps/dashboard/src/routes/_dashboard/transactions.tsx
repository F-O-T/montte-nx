import { createFileRoute } from "@tanstack/react-router";
import { TransactionsPage } from "@/pages/transactions/ui/transactions-page";

export const Route = createFileRoute("/_dashboard/transactions")({
   component: RouteComponent,
});

function RouteComponent() {
   return <TransactionsPage />;
}
