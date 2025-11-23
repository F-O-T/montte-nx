import { translate } from "@packages/localization";
import { StatsCard } from "@packages/ui/components/stats-card";

interface HomeStatsSectionProps {
   summary: {
      totalIncome: number;
      totalExpenses: number;
      netBalance: number;
   };
   performance: {
      paidOnTime: number;
      paidLate: number;
      totalBills: number;
      paymentRate: number;
   };
}

export function HomeStatsSection({
   summary,
   performance,
}: HomeStatsSectionProps) {
   return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
         <StatsCard
            description={translate(
               "dashboard.routes.home.financial-summary.net-balance.description",
            )}
            title={translate(
               "dashboard.routes.home.financial-summary.net-balance.title",
            )}
            value={`R$ ${summary.netBalance.toFixed(2)}`}
         />
         <StatsCard
            description={`${performance.paidOnTime + performance.paidLate} ${translate("dashboard.routes.home.financial-summary.payment-rate.description")} ${performance.totalBills} ${translate("dashboard.routes.home.financial-summary.payment-rate.bills-paid")}`}
            title={translate(
               "dashboard.routes.home.financial-summary.payment-rate.title",
            )}
            value={`${performance.paymentRate.toFixed(1)}%`}
         />
      </div>
   );
}
