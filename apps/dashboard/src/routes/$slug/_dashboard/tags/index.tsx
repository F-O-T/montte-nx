import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { TagsPage } from "@/pages/tags/ui/tags-page";

export const Route = createFileRoute("/$slug/_dashboard/tags/")({
   component: TagsPage,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.tags"),
   },
});
