import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { BankAccountsPage } from "@/pages/bank-accounts/ui/bank-accounts-page";

export const Route = createFileRoute("/$slug/_dashboard/bank-accounts/")({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate(
         "dashboard.routes.bank-accounts.list-section.title",
      ),
   },
});

function RouteComponent() {
   return <BankAccountsPage />;
}
