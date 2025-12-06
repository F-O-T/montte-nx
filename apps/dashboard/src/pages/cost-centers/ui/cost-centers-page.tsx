import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { DefaultHeader } from "@/default/default-header";
import { useSheet } from "@/hooks/use-sheet";
import { CostCenterListProvider } from "../features/cost-center-list-context";
import { ManageCostCenterForm } from "../features/manage-cost-center-form";
import { CostCentersCharts } from "./cost-centers-charts";
import { CostCentersListSection } from "./cost-centers-list-section";
import { CostCentersStats } from "./cost-centers-stats";

export type CostCenter =
   RouterOutput["costCenters"]["getAllPaginated"]["costCenters"][0];

export function CostCentersPage() {
   const { openSheet } = useSheet();

   return (
      <CostCenterListProvider>
         <main className="space-y-4">
            <DefaultHeader
               actions={
                  <Button
                     onClick={() =>
                        openSheet({
                           children: <ManageCostCenterForm />,
                        })
                     }
                  >
                     <Plus className="size-4" />
                     {translate("common.actions.add")}
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
         </main>
      </CostCenterListProvider>
   );
}
