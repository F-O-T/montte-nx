import { createFileRoute } from "@tanstack/react-router";
import { AutomationEditorPage } from "@/pages/automation-editor/ui/automation-editor-page";

export const Route = createFileRoute(
   "/$slug/_dashboard/automations/$automationId",
)({
   component: AutomationEditorPage,
   staticData: { breadcrumb: "Editar Automação" },
});
