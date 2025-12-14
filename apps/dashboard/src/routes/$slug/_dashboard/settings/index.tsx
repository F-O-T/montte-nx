import { translate } from "@packages/localization";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { SettingsMobileNav } from "@/pages/settings/ui/settings-mobile-nav";

export const Route = createFileRoute("/$slug/_dashboard/settings/")({
   component: SettingsIndexRoute,
   staticData: {
      breadcrumb: translate("dashboard.routes.settings.title"),
   },
});

function SettingsIndexRoute() {
   const isMobile = useIsMobile();
   const { slug } = Route.useParams();

   // On desktop, redirect to profile section by default
   // On mobile, show the navigation list (handled by layout, but we also render it here as fallback)
   if (!isMobile) {
      return <Navigate params={{ slug }} to="/$slug/settings/profile" />;
   }

   return <SettingsMobileNav />;
}
