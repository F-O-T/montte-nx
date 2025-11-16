import { TransactionsQuickActionsToolbar } from "./transactions-quick-actions-toolbar";
import { TransactionsListSection } from "./transactions-list-section";
import { TransactionsStats } from "./transactions-stats";

export function TransactionsPage() {
   return (
      <main className="grid md:grid-cols-3 gap-4">
         <div className="col-span-1 md:col-span-2 grid gap-4">
            <TransactionsQuickActionsToolbar />
            <TransactionsListSection />
         </div>
         <TransactionsStats />
      </main>
   );
}