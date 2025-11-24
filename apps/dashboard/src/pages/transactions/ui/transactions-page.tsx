import { DefaultHeader } from "@/default/default-header";
import { TransactionListProvider } from "../features/transaction-list-context";
import { TransactionsListSection } from "./transactions-list-section";
import { TransactionsStats } from "./transactions-stats";

export function TransactionsPage() {
   return (
      <TransactionListProvider>
         <main className="space-y-4">
            <DefaultHeader
               description="Visao geral de todas as entradas e saidas"
               title="Fluxo de caixa"
            />
            <TransactionsStats />
            <TransactionsListSection />
         </main>
      </TransactionListProvider>
   );
}
