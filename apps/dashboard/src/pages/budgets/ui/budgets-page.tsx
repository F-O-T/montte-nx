import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { DefaultHeader } from "@/default/default-header";
import { BudgetListProvider } from "../features/budget-list-context";
import { BudgetsListSection } from "./budgets-list-section";
import { BudgetsStats } from "./budgets-stats";

export type Budget = RouterOutput["budgets"]["getAllPaginated"]["budgets"][0];

export function BudgetsPage() {
   return (
      <BudgetListProvider>
         <main className="space-y-4">
            <DefaultHeader
               description={translate(
                  "dashboard.routes.budgets.page.description",
               )}
               title={translate("dashboard.routes.budgets.page.title")}
            />
            <BudgetsStats />
            <BudgetsListSection />
         </main>
      </BudgetListProvider>
   );
}
