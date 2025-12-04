import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { StatsCard } from "@packages/ui/components/stats-card";
import { formatDate } from "@packages/utils/date";

type Budget = RouterOutput["budgets"]["getById"];
type BudgetTarget =
   | { type: "category"; categoryId: string }
   | { type: "categories"; categoryIds: string[] }
   | { type: "tag"; tagId: string }
   | { type: "cost_center"; costCenterId: string };

interface BudgetInformationSectionProps {
   budget: Budget;
}

function formatBudgetDate(date: Date | string | null): string {
   if (!date) return "-";
   return formatDate(new Date(date), "DD/MM/YYYY HH:mm");
}

export function BudgetInformationSection({
   budget,
}: BudgetInformationSectionProps) {
   const periodLabels: Record<string, string> = {
      custom: translate("dashboard.routes.budgets.form.period.custom"),
      daily: translate("dashboard.routes.budgets.form.period.daily"),
      monthly: translate("dashboard.routes.budgets.form.period.monthly"),
      quarterly: translate("dashboard.routes.budgets.form.period.quarterly"),
      weekly: translate("dashboard.routes.budgets.form.period.weekly"),
      yearly: translate("dashboard.routes.budgets.form.period.yearly"),
   };

   const targetTypeLabels: Record<string, string> = {
      categories: translate("dashboard.routes.budgets.form.target.categories"),
      category: translate("dashboard.routes.budgets.form.target.category"),
      cost_center: translate(
         "dashboard.routes.budgets.form.target.cost_center",
      ),
      tag: translate("dashboard.routes.budgets.form.target.tag"),
   };

   const target = budget.target as BudgetTarget;
   const targetLabel = targetTypeLabels[target.type] ?? "-";
   const periodLabel =
      periodLabels[budget.periodType as string] ?? periodLabels.monthly ?? "-";

   return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatsCard
            description={targetLabel}
            title={translate(
               "dashboard.routes.budgets.details.information.target",
            )}
            value={targetLabel}
         />
         <StatsCard
            description={periodLabel}
            title={translate(
               "dashboard.routes.budgets.details.information.period",
            )}
            value={periodLabel}
         />
         <StatsCard
            description={formatBudgetDate(budget.createdAt)}
            title={translate(
               "dashboard.routes.budgets.details.information.created-at",
            )}
            value={formatBudgetDate(budget.createdAt)}
         />
         <StatsCard
            description={formatBudgetDate(budget.updatedAt)}
            title={translate(
               "dashboard.routes.budgets.details.information.updated-at",
            )}
            value={formatBudgetDate(budget.updatedAt)}
         />
      </div>
   );
}
