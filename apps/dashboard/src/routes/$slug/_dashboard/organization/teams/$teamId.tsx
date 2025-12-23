import { createFileRoute } from "@tanstack/react-router";
import { TeamDetailsPage } from "@/pages/team-details/ui/team-details-page";

export const Route = createFileRoute(
   "/$slug/_dashboard/organization/teams/$teamId",
)({
   component: TeamDetailsPage,
   staticData: {
      breadcrumb: "Team Details",
   },
});
