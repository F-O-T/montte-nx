import { createFileRoute } from "@tanstack/react-router";
import { CategoryDetailsPage } from "@/pages/category-details/ui/category-details-page";

export const Route = createFileRoute("/_dashboard/categories/$slug")({
   component: RouteComponent,
});

function RouteComponent() {
   return <CategoryDetailsPage />;
}

