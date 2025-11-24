import { translate } from "@packages/localization";
import { DefaultHeader } from "@/default/default-header";
import { BankAccountsListSection } from "./bank-accounts-list-section";
import { BankAccountsStats } from "./bank-accounts-stats";

export function BankAccountsPage() {
   return (
      <main className=" space-y-4">
         <DefaultHeader
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
