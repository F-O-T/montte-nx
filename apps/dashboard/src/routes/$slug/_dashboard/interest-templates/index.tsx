import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { InterestTemplatesPage } from "@/pages/interest-templates/ui/interest-templates-page";

export const Route = createFileRoute("/$slug/_dashboard/interest-templates/")({
   component: InterestTemplatesPage,
   staticData: {
      breadcrumb: translate("dashboard.routes.interest-templates.title"),
   },
});
