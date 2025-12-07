import { createFileRoute } from "@tanstack/react-router";
import { AutomationDetailsPage } from "@/pages/automation-details/ui/automation-details-page";

export const Route = createFileRoute(
   "/$slug/_dashboard/automations/$automationId",
)({
   component: AutomationDetailsPage,
   staticData: { breadcrumb: "Editar Automação" },
});
