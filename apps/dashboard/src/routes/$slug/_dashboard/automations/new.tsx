import { createFileRoute } from "@tanstack/react-router";
import { NewAutomationPage } from "@/pages/automation-editor/ui/automation-editor-page";

export const Route = createFileRoute("/$slug/_dashboard/automations/new")({
   component: NewAutomationPage,
   staticData: { breadcrumb: "Nova Automação" },
});
