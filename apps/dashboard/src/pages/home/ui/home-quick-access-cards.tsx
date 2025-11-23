import { translate } from "@packages/localization";
import { StatsCard } from "@packages/ui/components/stats-card";

interface HomeQuickAccessCardsProps {
   summary: {
      totalIncome: number;
      totalExpenses: number;
   };
}

export function HomeQuickAccessCards({ summary }: HomeQuickAccessCardsProps) {
   return (
      <div className="grid grid-cols-2 gap-4">
         <StatsCard
            description={translate(
               "dashboard.routes.home.financial-summary.total-income.description",
            )}
            title={translate(
               "dashboard.routes.home.financial-summary.total-income.title",
            )}
            value={`R$ ${summary.totalIncome.toFixed(2)}`}
         />
         <StatsCard
            description={translate(
               "dashboard.routes.home.financial-summary.total-expenses.description",
            )}
            title={translate(
               "dashboard.routes.home.financial-summary.total-expenses.title",
            )}
            value={`R$ ${summary.totalExpenses.toFixed(2)}`}
         />
      </div>
   );
}
