import { translate } from "@packages/localization";
import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/pages/profile/ui/profile-page";

export const Route = createFileRoute("/$slug/_dashboard/profile")({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.profile"),
   },
});

function RouteComponent() {
   return <ProfilePage />;
}
