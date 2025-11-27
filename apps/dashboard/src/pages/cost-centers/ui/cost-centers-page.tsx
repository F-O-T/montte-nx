import type { RouterOutput } from "@packages/api/client";
import { DefaultHeader } from "@/default/default-header";
import { CostCenterListProvider } from "../features/cost-center-list-context";
import { CostCentersCharts } from "./cost-centers-charts";
import { CostCentersListSection } from "./cost-centers-list-section";
import { CostCentersStats } from "./cost-centers-stats";
export type CostCenter =
   RouterOutput["costCenters"]["getAllPaginated"]["costCenters"][0];

export function CostCentersPage() {
   return (
      <CostCenterListProvider>
         <main className="space-y-4">
            <DefaultHeader
               description="Gerencie seus centros de custo"
               title="Centros de Custo"
            />
            <CostCentersStats />
            <CostCentersListSection />
            <CostCentersCharts />
         </main>
      </CostCenterListProvider>
   );
}
