import { translate } from "@packages/localization";
import { DefaultHeader } from "@/default/default-header";
import { ReportsProvider } from "../features/reports-context";
import { ReportsListSection } from "./reports-list-section";
import { ReportsStats } from "./reports-stats";

export function ReportsPage() {
   return (
      <ReportsProvider>
         <main className="space-y-4">
            <DefaultHeader
               description={translate("dashboard.routes.reports.description")}
               title={translate("dashboard.routes.reports.title")}
            />
            <ReportsStats />
            <ReportsListSection />
         </main>
      </ReportsProvider>
   );
}
