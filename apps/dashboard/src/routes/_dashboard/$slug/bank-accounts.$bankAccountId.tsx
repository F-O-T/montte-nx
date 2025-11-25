import { createFileRoute } from "@tanstack/react-router";
import { BankAccountDetailsPage } from "@/pages/bank-account-details/ui/bank-account-details-page";

export const Route = createFileRoute(
   "/_dashboard/$slug/bank-accounts/$bankAccountId",
)({
   component: RouteComponent,
});

function RouteComponent() {
   return <BankAccountDetailsPage />;
}
