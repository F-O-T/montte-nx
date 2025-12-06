import { createFileRoute } from "@tanstack/react-router";
import { CategoryDetailsPage } from "@/pages/category-details/ui/category-details-page";

export const Route = createFileRoute(
   "/$slug/_dashboard/categories/$categoryId",
)({
   component: CategoryDetailsPage,
   staticData: { breadcrumb: "Detalhes da categoria" },
});
