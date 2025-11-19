import { createFileRoute } from "@tanstack/react-router";
import { BankAccountsPage } from "@/pages/bank-accounts/ui/bank-accounts-page";

export const Route = createFileRoute("/_dashboard/bank-accounts/")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Bank Accounts",
   },
});

function RouteComponent() {
   return <BankAccountsPage />;
}
