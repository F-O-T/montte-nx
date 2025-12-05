import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { DefaultHeader } from "@/default/default-header";
import { ManageBankAccountForm } from "@/features/bank-account/ui/manage-bank-account-form";
import { useSheet } from "@/hooks/use-sheet";
import { BankAccountsListSection } from "./bank-accounts-list-section";
import { BankAccountsStats } from "./bank-accounts-stats";

export function BankAccountsPage() {
   const { openSheet } = useSheet();

   return (
      <main className=" space-y-4">
         <DefaultHeader
            actions={
               <Button
                  onClick={() =>
                     openSheet({ children: <ManageBankAccountForm /> })
                  }
               >
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
      </main>
   );
}
