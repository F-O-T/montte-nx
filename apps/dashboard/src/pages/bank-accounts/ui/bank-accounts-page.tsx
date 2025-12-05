import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { DefaultHeader } from "@/default/default-header";
import { ManageBankAccountForm } from "@/features/bank-account/ui/manage-bank-account-form";
import { usePendingOfxImport } from "@/hooks/use-pending-ofx-import";
import { useSheet } from "@/hooks/use-sheet";
import { BankAccountsListSection } from "./bank-accounts-list-section";
import { BankAccountsStats } from "./bank-accounts-stats";

type BankAccountsPageProps = {
   selectForImport?: boolean;
};

export function BankAccountsPage({ selectForImport }: BankAccountsPageProps) {
   const { openSheet } = useSheet();
   const { getPending } = usePendingOfxImport();

   useEffect(() => {
      if (selectForImport) {
         const pending = getPending();
         if (pending) {
            toast.info(
               `Arquivo "${pending.filename}" pronto para importar. Selecione uma conta bancária.`,
               { duration: 5000 },
            );
         } else {
            toast.info(
               "Selecione uma conta bancária para importar o arquivo OFX.",
               { duration: 5000 },
            );
         }
      }
   }, [selectForImport, getPending]);

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
