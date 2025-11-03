import { ProfilePage } from "@/pages/profile/ui/profile-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/profile")({
   component: RouteComponent,
});

function RouteComponent() {
   return <ProfilePage />;
}
