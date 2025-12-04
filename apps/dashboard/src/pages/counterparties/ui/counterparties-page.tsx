import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DefaultHeader } from "@/default/default-header";
import { CounterpartyListProvider } from "../features/counterparty-list-context";
import { ManageCounterpartySheet } from "../features/manage-counterparty-sheet";
import { CounterpartiesListSection } from "./counterparties-list-section";
import { CounterpartiesStats } from "./counterparties-stats";

export type Counterparty =
   RouterOutput["counterparties"]["getAllPaginated"]["counterparties"][0];

export function CounterpartiesPage() {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

   return (
      <CounterpartyListProvider>
         <main className="space-y-4">
            <DefaultHeader
               actions={
                  <Button onClick={() => setIsCreateSheetOpen(true)}>
                     <Plus className="size-4" />
                     {translate(
                        "dashboard.routes.counterparties.actions.add-new",
                     )}
                  </Button>
               }
               description={translate(
                  "dashboard.routes.counterparties.description",
               )}
               title={translate("dashboard.routes.counterparties.title")}
            />
            <CounterpartiesStats />
            <CounterpartiesListSection />
            <ManageCounterpartySheet
               onOpen={isCreateSheetOpen}
               onOpenChange={setIsCreateSheetOpen}
            />
         </main>
      </CounterpartyListProvider>
   );
}
