import { createFileRoute } from "@tanstack/react-router";
import { OrganizationInvitesPage } from "@/pages/organization-invites/ui/organization-invites-page";

export const Route = createFileRoute("/_dashboard/organization/invites")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Invites",
   },
});

function RouteComponent() {
   return <OrganizationInvitesPage />;
}
