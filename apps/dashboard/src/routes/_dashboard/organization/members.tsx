import { OrganizationMembersPage } from "@/pages/organization-members/ui/organization-members-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/organization/members")({
   component: RouteComponent,
   staticData: {
      breadcrumb: "Members",
   },
});

function RouteComponent() {
   return <OrganizationMembersPage />;
}
