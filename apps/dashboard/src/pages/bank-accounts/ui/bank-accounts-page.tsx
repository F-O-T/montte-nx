import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DefaultHeader } from "@/default/default-header";
import { ManageBankAccountSheet } from "@/features/bank-account/ui/manage-bank-account-sheet";
import { BankAccountsListSection } from "./bank-accounts-list-section";
import { BankAccountsStats } from "./bank-accounts-stats";

export function BankAccountsPage() {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

   return (
      <main className=" space-y-4">
         <DefaultHeader
            actions={
               <Button onClick={() => setIsCreateSheetOpen(true)}>
                  <Plus className="size-4" />
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.actions.add-new",
                  )}
               </Button>
            }
            description={translate(
               "dashboard.routes.bank-accounts.list-section.description",
            )}
            title={translate(
               "dashboard.routes.bank-accounts.list-section.title",
            )}
         />
         <BankAccountsStats />
         <BankAccountsListSection />
         <ManageBankAccountSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </main>
   );
}
