import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { StatsCard } from "@packages/ui/components/stats-card";

type Budget = RouterOutput["budgets"]["getById"];

interface BudgetDetailsStatsProps {
   budget: Budget;
}

function formatCurrency(value: number): string {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(value);
}

export function BudgetDetailsStats({ budget }: BudgetDetailsStatsProps) {
   const { progress, currentPeriod } = budget;

   const percentage = progress.percentage;
   const forecastPercentage = progress.forecastPercentage;
   const available = progress.available;

   const periodLabels: Record<string, string> = {
      daily: translate("dashboard.routes.budgets.form.period.daily"),
      weekly: translate("dashboard.routes.budgets.form.period.weekly"),
      monthly: translate("dashboard.routes.budgets.form.period.monthly"),
      quarterly: translate("dashboard.routes.budgets.form.period.quarterly"),
      yearly: translate("dashboard.routes.budgets.form.period.yearly"),
      custom: translate("dashboard.routes.budgets.form.period.custom"),
   };

   const daysRemaining = currentPeriod
      ? Math.ceil(
           (new Date(currentPeriod.periodEnd).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24),
        )
      : 0;

   const dailyBudget = daysRemaining > 0 ? available / daysRemaining : 0;

   const isOverBudget = percentage >= 100;
   const isNearLimit = percentage >= 80 && percentage < 100;

   const utilizationDescription = isOverBudget
      ? translate("dashboard.routes.budgets.progress.over-budget")
      : isNearLimit
        ? translate("dashboard.routes.budgets.stats.budgets-near-limit.title")
        : "No caminho certo";

   const periodLabel =
      periodLabels[budget.periodType as string] ||
      translate("dashboard.routes.budgets.form.period.monthly");

   return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <StatsCard
            description={utilizationDescription}
            title={translate(
               "dashboard.routes.budgets.stats.average-utilization.title",
            )}
            value={`${percentage.toFixed(1)}%`}
         />
         <StatsCard
            description={periodLabel}
            title="Dias restantes"
            value={Math.max(0, daysRemaining)}
         />
         <StatsCard
            description="por dia disponível"
            title="Orçamento diário"
            value={formatCurrency(dailyBudget)}
         />
         <StatsCard
            description="incluindo agendados"
            title="Previsão"
            value={`${forecastPercentage.toFixed(1)}%`}
         />
      </div>
   );
}
