import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { TagsPage } from "@/pages/tags/ui/tags-page";

export const Route = createFileRoute("/_dashboard/$slug/tags/")({
   component: TagsPage,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.tags"),
   },
});
