import { createFileRoute } from "@tanstack/react-router";
import { BudgetDetailsPage } from "@/pages/budget-details/ui/budget-details-page";

export const Route = createFileRoute("/_dashboard/$slug/budgets/$budgetId")({
   component: BudgetDetailsPage,
   staticData: { breadcrumb: "Detalhes do orçamento" },
});
