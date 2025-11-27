import type { RouterOutput } from "@packages/api/client";
import { CostCenterListProvider } from "../features/cost-center-list-context";
import { CostCentersListSection } from "./cost-centers-list-section";
import { CostCentersQuickActionsToolbar } from "./cost-centers-quick-actions-toolbar";
import { CostCentersStats } from "./cost-centers-stats";
export type CostCenter =
   RouterOutput["costCenters"]["getAllPaginated"]["costCenters"][0];

export function CostCentersPage() {
   return (
      <CostCenterListProvider>
         <main className="grid md:grid-cols-3 gap-4">
            <div className="h-min col-span-1 md:col-span-2 grid gap-4">
               <CostCentersQuickActionsToolbar />
               <CostCentersListSection />
            </div>
            <CostCentersStats />
         </main>
      </CostCenterListProvider>
   );
}
