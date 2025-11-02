import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { trpc } from "@/integrations/clients";
import { AddTransactionSheet } from "../features/add-transaction-sheet";
import { TransactionsTable } from "./transactions-table";

export type Transaction = {
   amount: number;
   category: string;
   date: string;
   description: string;
   id: string;
   type: "income" | "expense";
};

function TransactionsContent() {
   const { data: transactions } = useQuery(
      trpc.transactions.getAll.queryOptions(),
   );

   // Transform API data to match UI expectations
   const uiTransactions: Transaction[] = (transactions || []).map(
      (transaction: any) => ({
         ...transaction,
         amount: parseFloat(transaction.amount),
         date: transaction.date.toISOString().split("T")[0],
      }),
   );

   return (
      <div className="space-y-8">
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-3xl font-bold tracking-tight">
                  Transactions
               </h1>
               <p className="text-muted-foreground mt-1">
                  Track and manage your financial transactions
               </p>
            </div>
            <AddTransactionSheet />
         </div>

         <TransactionsTable transactions={uiTransactions} />
      </div>
   );
}

function TransactionsErrorFallback({
   error,
   resetErrorBoundary,
}: {
   error: Error;
   resetErrorBoundary: () => void;
}) {
   return (
      <div className="flex items-center justify-center h-96">
         <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold text-destructive">
               Failed to load transactions
            </h2>
            <p className="text-muted-foreground">
               {error.message || "An unexpected error occurred"}
            </p>
            <button
               className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
               onClick={resetErrorBoundary}
            >
               Try again
            </button>
         </div>
      </div>
   );
}

export function TransactionsPage() {
   return (
      <ErrorBoundary FallbackComponent={TransactionsErrorFallback}>
         <Suspense
            fallback={
               <div className="flex items-center justify-center h-96">
                  <div className="text-center space-y-4">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                     <p className="text-muted-foreground">
                        Loading transactions...
                     </p>
                  </div>
               </div>
            }
         >
            <TransactionsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
