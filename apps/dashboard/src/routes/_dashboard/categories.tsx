import { createFileRoute } from "@tanstack/react-router";
import { CategoriesPage } from "../../pages/categories/ui/categories-page";

export const Route = createFileRoute("/_dashboard/categories")({
   component: CategoriesPage,
});
