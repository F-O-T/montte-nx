import { createFileRoute } from "@tanstack/react-router";
import { translate } from "@packages/localization";
import { ProfilePage } from "@/pages/profile/ui/profile-page";

export const Route = createFileRoute("/_dashboard/profile")({
   component: RouteComponent,
   staticData: {
      breadcrumb: translate("dashboard.layout.breadcrumbs.profile"),
   },
});

function RouteComponent() {
   return <ProfilePage />;
}
