import { Badge } from "@packages/ui/components/badge";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Combobox,
   type ComboboxOption,
} from "@packages/ui/components/combobox";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Input } from "@packages/ui/components/input";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from "@packages/ui/components/pagination";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Skeleton } from "@packages/ui/components/skeleton";
import { ArrowDown, ArrowUp, Search, Wallet } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";

export type Transaction = {
   amount: number;
   category: string;
   date: string;
   description: string;
   id: string;
   type: "income" | "expense";
};

function TransactionItem({ transaction }: { transaction: Transaction }) {
   return (
      <Item>
         <ItemMedia variant="icon">
            <div
               className={`size-8 rounded-full flex items-center justify-center ${
                  transaction.type === "income" ? "bg-green-100" : "bg-red-100"
               }`}
            >
               {transaction.type === "income" ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
               ) : (
                  <ArrowDown className="h-4 w-4 text-red-600" />
               )}
            </div>
         </ItemMedia>
         <ItemContent>
            <ItemTitle>{transaction.description}</ItemTitle>
            <ItemDescription>
               <div className="flex items-center gap-2">
                  <Badge className="text-xs font-normal" variant="outline">
                     {transaction.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                     {new Date(transaction.date).toLocaleDateString()}
                  </span>
               </div>
            </ItemDescription>
         </ItemContent>
         <ItemActions>
            <div className="text-right">
               <div
                  className={`font-mono font-medium text-sm ${
                     transaction.type === "income"
                        ? "text-green-600"
                        : "text-red-600"
                  }`}
               >
                  ${Math.abs(transaction.amount).toFixed(2)}
               </div>
            </div>
         </ItemActions>
         <ItemSeparator />
      </Item>
   );
}

function TransactionsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Transactions List</CardTitle>
            <CardDescription>
               Manage all your financial transactions
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription:
                  "Failed to load transactions. Please try again later.",
               errorTitle: "Error loading transactions",
               retryText: "Retry",
            })(props)}
         </CardContent>
      </Card>
   );
}

function TransactionsListSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>Transactions List</CardTitle>
            <CardDescription>
               Manage all your financial transactions
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               {Array.from({ length: 5 }).map((_, index) => (
                  <div
                     className="flex items-center space-x-4 p-4 border rounded-lg"
                     key={`transaction-skeleton-${index + 1}`}
                  >
                     <Skeleton className="h-10 w-10 rounded-full" />
                     <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                     </div>
                     <div className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                     </div>
                  </div>
               ))}
            </div>
         </CardContent>
         <CardFooter>
            <Skeleton className="h-10 w-full" />
         </CardFooter>
      </Card>
   );
}

function TransactionsListContent() {
   const [currentPage, setCurrentPage] = useState(1);
   const [searchTerm, setSearchTerm] = useState("");
   const [categoryFilter, setCategoryFilter] = useState("all");
   const [typeFilter, setTypeFilter] = useState("all");
   const pageSize = 10;

   const { data: transactions } = useSuspenseQuery(
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

   const filteredTransactions = uiTransactions.filter((transaction) => {
      const matchesSearch =
         transaction.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
         categoryFilter === "all" || transaction.category === categoryFilter;
      const matchesType =
         typeFilter === "all" || transaction.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
   });

   // Pagination logic
   const totalPages = Math.ceil(filteredTransactions.length / pageSize);
   const startIndex = (currentPage - 1) * pageSize;
   const paginatedTransactions = filteredTransactions.slice(
      startIndex,
      startIndex + pageSize,
   );

   // Reset to first page when filters change
   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const categories = Array.from(
      new Set(uiTransactions.map((t) => t.category)),
   );

   const categoryOptions: ComboboxOption[] = [
      { label: "All Categories", value: "all" },
      ...categories.map((category) => ({ label: category, value: category })),
   ];

   return (
      <Card>
         <CardHeader>
            <CardTitle>Transactions List</CardTitle>
            <CardDescription>
               Manage all your financial transactions
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-4">
               <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                     className="pl-10 h-10"
                     onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleFilterChange();
                     }}
                     placeholder="Search transactions..."
                     value={searchTerm}
                  />
               </div>
               <div className="flex gap-3">
                  <Combobox
                     className="w-48"
                     emptyMessage="No categories found."
                     onValueChange={(value) => {
                        setCategoryFilter(value);
                        handleFilterChange();
                     }}
                     options={categoryOptions}
                     placeholder="All Categories"
                     searchPlaceholder="Search categories..."
                     value={categoryFilter}
                  />
                  <Select
                     onValueChange={(value) => {
                        setTypeFilter(value);
                        handleFilterChange();
                     }}
                     value={typeFilter}
                  >
                     <SelectTrigger className="w-36 h-10">
                        <SelectValue placeholder="All Types" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
         </CardHeader>
         <CardContent>
            {paginatedTransactions.length === 0 ? (
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Wallet className="size-6" />
                     </EmptyMedia>
                     <EmptyTitle>No transactions found</EmptyTitle>
                     <EmptyDescription>
                        {filteredTransactions.length === 0
                           ? "Create your first transaction to get started tracking your finances."
                           : "Try adjusting your filters to find what you're looking for."}
                     </EmptyDescription>
                  </EmptyContent>
               </Empty>
            ) : (
               <ItemGroup>
                  {paginatedTransactions.map((transaction) => (
                     <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                     />
                  ))}
               </ItemGroup>
            )}
         </CardContent>
         {totalPages > 1 && (
            <CardFooter>
               <Pagination>
                  <PaginationContent>
                     <PaginationItem>
                        <PaginationPrevious
                           className={
                              currentPage === 1
                                 ? "pointer-events-none opacity-50"
                                 : ""
                           }
                           href="#"
                           onClick={() =>
                              setCurrentPage((prev) => {
                                 const newPage = prev - 1;
                                 return newPage >= 1 ? newPage : prev;
                              })
                           }
                        />
                     </PaginationItem>

                     {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i: number): number => {
                           if (totalPages <= 5) {
                              return i + 1;
                           } else if (currentPage <= 3) {
                              return i + 1;
                           } else if (currentPage >= totalPages - 2) {
                              return totalPages - 4 + i;
                           } else {
                              return currentPage - 2 + i;
                           }
                        },
                     ).map((pageNum) => (
                        <PaginationItem key={pageNum}>
                           <PaginationLink
                              href="#"
                              isActive={pageNum === currentPage}
                              onClick={() => setCurrentPage(pageNum)}
                           >
                              {pageNum}
                           </PaginationLink>
                        </PaginationItem>
                     ))}

                     <PaginationItem>
                        <PaginationNext
                           className={
                              currentPage === totalPages
                                 ? "pointer-events-none opacity-50"
                                 : ""
                           }
                           href="#"
                           onClick={() =>
                              setCurrentPage((prev) => {
                                 const newPage = prev + 1;
                                 return newPage <= totalPages ? newPage : prev;
                              })
                           }
                        />
                     </PaginationItem>
                  </PaginationContent>
               </Pagination>
            </CardFooter>
         )}
      </Card>
   );
}

export function TransactionsListSection() {
   return (
      <ErrorBoundary FallbackComponent={TransactionsListErrorFallback}>
         <Suspense fallback={<TransactionsListSkeleton />}>
            <TransactionsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}

