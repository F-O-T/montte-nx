import { createFileRoute } from "@tanstack/react-router";
import { InterestTemplateDetailsPage } from "@/pages/interest-template-details/ui/interest-template-details-page";

export const Route = createFileRoute(
   "/$slug/_dashboard/interest-templates/$interestTemplateId",
)({
   component: InterestTemplateDetailsPage,
   staticData: { breadcrumb: "Detalhes do template" },
});
