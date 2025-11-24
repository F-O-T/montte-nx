import { DefaultHeader } from "@/default/default-header";
import { BankAccountsListSection } from "./bank-accounts-list-section";
import { BankAccountsStats } from "./bank-accounts-stats";

export function BankAccountsPage() {
   return (
      <main className="grid gap-4">
         <DefaultHeader
            description="Manage your connected bank accounts"
            title="Bank Accounts"
         />
         <BankAccountsStats />
         <BankAccountsListSection />
      </main>
   );
}
