import { translate } from "@packages/localization";
import { CashFlowChart } from "@/features/reports/ui/cash-flow-chart";
import { FinancialSummaryChart } from "@/features/reports/ui/financial-summary-chart";
import { PlannedVsActualChart } from "@/features/reports/ui/planned-vs-actual-chart";

interface HomeChartsSectionProps {
   cashFlow: any;
   plannedVsActual: any;
}

export function HomeChartsSection({
   cashFlow,
   plannedVsActual,
}: HomeChartsSectionProps) {
   return (
      <div className="grid gap-4">
         <FinancialSummaryChart
            data={cashFlow}
            description={translate(
               "dashboard.routes.home.charts.financial-evolution.description",
            )}
            title={translate(
               "dashboard.routes.home.charts.financial-evolution.title",
            )}
         />

         <div className="grid gap-4 md:grid-cols-2">
            <CashFlowChart
               data={cashFlow}
               description={translate(
                  "dashboard.routes.home.charts.cash-flow.description",
               )}
               title={translate("dashboard.routes.home.charts.cash-flow.title")}
            />
            <PlannedVsActualChart
               data={plannedVsActual}
               description={translate(
                  "dashboard.routes.home.charts.planned-vs-actual.description",
               )}
               title={translate(
                  "dashboard.routes.home.charts.planned-vs-actual.title",
               )}
            />
         </div>
      </div>
   );
}
