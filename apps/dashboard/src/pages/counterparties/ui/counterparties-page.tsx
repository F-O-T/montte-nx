import type { RouterOutput } from "@packages/api/client";
import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { DefaultHeader } from "@/default/default-header";
import { useSheet } from "@/hooks/use-sheet";
import { CounterpartyListProvider } from "../features/counterparty-list-context";
import { ManageCounterpartyForm } from "../features/manage-counterparty-form";
import { CounterpartiesListSection } from "./counterparties-list-section";
import { CounterpartiesStats } from "./counterparties-stats";

export type Counterparty =
   RouterOutput["counterparties"]["getAllPaginated"]["counterparties"][0];

export function CounterpartiesPage() {
   const { openSheet } = useSheet();

   return (
      <CounterpartyListProvider>
         <main className="space-y-4">
            <DefaultHeader
               actions={
                  <Button
                     onClick={() =>
                        openSheet({
                           children: <ManageCounterpartyForm />,
                        })
                     }
                  >
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
         </main>
      </CounterpartyListProvider>
   );
}
