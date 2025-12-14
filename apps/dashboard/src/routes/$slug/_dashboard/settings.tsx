import { translate } from "@packages/localization";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SettingsLayout } from "@/pages/settings/ui/settings-layout";

export const Route = createFileRoute("/$slug/_dashboard/settings")({
   component: SettingsLayoutRoute,
   staticData: {
      breadcrumb: translate("dashboard.routes.settings.title"),
   },
});

function SettingsLayoutRoute() {
   return (
      <SettingsLayout>
         <Outlet />
      </SettingsLayout>
   );
}
