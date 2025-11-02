import { AddTransactionSheet } from "../features/add-transaction-sheet";
import { TransactionsTable } from "./transactions-table";

export type Transaction = {
   amount: number;
   category: string;
   date: string;
   description: string;
   id: string;
   status: "completed" | "pending";
   type: "income" | "expense";
};

// Mock transaction data
const mockTransactions: Transaction[] = [
   {
      amount: -85.5,
      category: "Food & Dining",
      date: "2024-11-02",
      description: "Grocery Store Purchase",
      id: "1",
      status: "completed",
      type: "expense",
   },
   {
      amount: 3500.0,
      category: "Income",
      date: "2024-11-01",
      description: "Salary Deposit",
      id: "2",
      status: "completed",
      type: "income",
   },
   {
      amount: -120.75,
      category: "Utilities",
      date: "2024-10-31",
      description: "Electric Bill",
      id: "3",
      status: "completed",
      type: "expense",
   },
   {
      amount: -245.99,
      category: "Shopping",
      date: "2024-10-30",
      description: "Online Shopping",
      id: "4",
      status: "completed",
      type: "expense",
   },
   {
      amount: 750.0,
      category: "Income",
      date: "2024-10-29",
      description: "Freelance Payment",
      id: "5",
      status: "pending",
      type: "income",
   },
   {
      amount: -45.2,
      category: "Transportation",
      date: "2024-10-28",
      description: "Gas Station",
      id: "6",
      status: "completed",
      type: "expense",
   },
   {
      amount: -12.5,
      category: "Food & Dining",
      date: "2024-10-27",
      description: "Coffee Shop",
      id: "7",
      status: "completed",
      type: "expense",
   },
   {
      amount: -1200.0,
      category: "Housing",
      date: "2024-10-26",
      description: "Rent Payment",
      id: "8",
      status: "completed",
      type: "expense",
   },
];

export function TransactionsPage() {
   const categories = Array.from(
      new Set(mockTransactions.map((t) => t.category)),
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
            <AddTransactionSheet categories={categories} />
         </div>

         <TransactionsTable transactions={mockTransactions} />
      </div>
   );
}
