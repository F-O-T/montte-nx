import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BankAccountsPage } from "@/pages/bank-accounts/ui/bank-accounts-page";

const bankAccountsSearchSchema = z.object({
   selectForImport: z.string().optional(),
});

export const Route = createFileRoute("/$slug/_dashboard/bank-accounts/")({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate(
         "dashboard.routes.bank-accounts.list-section.title",
      ),
   },
   validateSearch: bankAccountsSearchSchema,
});

function RouteComponent() {
   const { selectForImport } = Route.useSearch();
   return <BankAccountsPage selectForImport={selectForImport === "true"} />;
}
