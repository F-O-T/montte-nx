import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { MonthSelector } from "@packages/ui/components/month-selector";
import { TimePeriodChips } from "@packages/ui/components/time-period-chips";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DefaultHeader } from "@/default/default-header";
import {
   TransactionListProvider,
   useTransactionList,
} from "@/features/transaction/lib/transaction-list-context";
import { ManageTransactionSheet } from "@/features/transaction/ui/manage-transaction-sheet";
import { TransactionsListSection } from "./transactions-list-section";
import { TransactionsStats } from "./transactions-stats";

function TransactionsPageContent() {
   const [isCreateTransactionOpen, setIsCreateTransactionOpen] =
      useState(false);
   const {
      timePeriod,
      handleTimePeriodChange,
      selectedMonth,
      handleMonthChange,
   } = useTransactionList();

   return (
      <main className="space-y-4">
         <DefaultHeader
            actions={
               <Button onClick={() => setIsCreateTransactionOpen(true)}>
                  <Plus className="size-4" />
                  {translate(
                     "dashboard.routes.transactions.features.add-new.title",
                  )}
               </Button>
            }
            description={translate(
               "dashboard.routes.transactions.list-section.description",
            )}
            title={translate(
               "dashboard.routes.transactions.list-section.title",
            )}
         />

         <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TimePeriodChips
               onValueChange={(period) => handleTimePeriodChange(period)}
               size="sm"
               value={timePeriod}
            />
            <div className="hidden sm:block h-4 w-px bg-border" />
            <MonthSelector
               date={selectedMonth}
               disabled={timePeriod !== null && timePeriod !== "all-time"}
               onSelect={handleMonthChange}
            />
         </div>

         <TransactionsStats />
         <TransactionsListSection />

         <ManageTransactionSheet
            onOpen={isCreateTransactionOpen}
            onOpenChange={setIsCreateTransactionOpen}
         />
      </main>
   );
}

export function TransactionsPage() {
   return (
      <TransactionListProvider>
         <TransactionsPageContent />
      </TransactionListProvider>
   );
}
