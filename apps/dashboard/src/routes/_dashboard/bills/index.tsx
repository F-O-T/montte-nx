import { createFileRoute } from "@tanstack/react-router";
import { BillsPage } from "@/pages/bills/ui/bills-page";
import { translate } from "@packages/localization";
import { z } from "zod";

const billsSearchSchema = z.object({
   type: z.enum(["payable", "receivable"]).optional(),
});

export const Route = createFileRoute("/_dashboard/bills/")({
   component: RouteComponent,
   validateSearch: billsSearchSchema,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.bills"),
   },
});

function RouteComponent() {
   return <BillsPage />;
}
