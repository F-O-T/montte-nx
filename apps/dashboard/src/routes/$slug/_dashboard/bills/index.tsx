import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BillsPage } from "@/pages/bills/ui/bills-page";

const billsSearchSchema = z.object({
   type: z.enum(["payable", "receivable"]).optional(),
});

export const Route = createFileRoute("/$slug/_dashboard/bills/")({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.bills"),
   },
   validateSearch: billsSearchSchema,
});

function RouteComponent() {
   return <BillsPage />;
}
