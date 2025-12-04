import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DefaultHeader } from "@/default/default-header";
import { CostCenterListProvider } from "../features/cost-center-list-context";
import { ManageCostCenterSheet } from "../features/manage-cost-center-sheet";
import { CostCentersCharts } from "./cost-centers-charts";
import { CostCentersListSection } from "./cost-centers-list-section";
import { CostCentersStats } from "./cost-centers-stats";

export type CostCenter =
   RouterOutput["costCenters"]["getAllPaginated"]["costCenters"][0];

export function CostCentersPage() {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

   return (
      <CostCenterListProvider>
         <main className="space-y-4">
            <DefaultHeader
               actions={
                  <Button onClick={() => setIsCreateSheetOpen(true)}>
                     <Plus className="size-4" />
                     {translate(
                        "dashboard.routes.cost-centers.actions-toolbar.actions.add-new",
                     )}
                  </Button>
               }
               description={translate(
                  "dashboard.routes.cost-centers.list-section.description",
               )}
               title={translate(
                  "dashboard.routes.cost-centers.list-section.title",
               )}
            />
            <CostCentersStats />
            <CostCentersListSection />
            <CostCentersCharts />
            <ManageCostCenterSheet
               onOpen={isCreateSheetOpen}
               onOpenChange={setIsCreateSheetOpen}
            />
         </main>
      </CostCenterListProvider>
   );
}
