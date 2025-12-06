import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CustomReportsPage } from "@/pages/custom-reports/ui/custom-reports-page";

const customReportsSearchSchema = z.object({
   type: z.enum(["dre_gerencial", "dre_fiscal"]).optional(),
});

export const Route = createFileRoute("/$slug/_dashboard/custom-reports/")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Relatórios Personalizados",
   },
   validateSearch: customReportsSearchSchema,
});

function RouteComponent() {
   const { type } = Route.useSearch();
   return <CustomReportsPage filterType={type} />;
}
