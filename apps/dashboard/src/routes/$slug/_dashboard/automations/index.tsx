import { createFileRoute } from "@tanstack/react-router";
import { AutomationsPage } from "@/pages/automations/ui/automations-page";

export const Route = createFileRoute("/$slug/_dashboard/automations/")({
   component: AutomationsPage,
   staticData: {
      breadcrumb: "Automações",
   },
});
