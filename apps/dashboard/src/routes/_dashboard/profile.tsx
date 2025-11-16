import { createFileRoute } from "@tanstack/react-router";

import { ProfilePage } from "@/pages/profile/ui/profile-page";

export const Route = createFileRoute("/_dashboard/profile")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Profile",
   },
});

function RouteComponent() {
   return <ProfilePage />;
}
