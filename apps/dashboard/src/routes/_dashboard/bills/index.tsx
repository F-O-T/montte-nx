import { BillsPage } from "@/pages/bills/ui/bills-page";
import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const billsSearchSchema = z.object({
   type: z.enum(["payable", "receivable"]).optional(),
});

export const Route = createFileRoute("/_dashboard/bills/")({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.bills"),
   },
   validateSearch: billsSearchSchema,
});

function RouteComponent() {
   return <BillsPage />;
}
