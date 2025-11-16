import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Checkbox } from "@packages/ui/components/checkbox";
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
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
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
import { ArrowDown, ArrowUp, Edit, Eye, MoreHorizontal, PlusIcon, Search, Trash2, Wallet } from "lucide-react";
import { Fragment, Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DeleteTransaction } from "../features/delete-transaction-dialog";
import { EditTransactionSheet } from "../features/edit-transaction-sheet";
import { TransactionListProvider, useTransactionList } from "../features/transaction-list-context";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { trpc } from "@/integrations/clients";

export type Transaction = {
   amount: number;
   category: string;
   date: string;
   description: string;
   id: string;
   type: "income" | "expense";
};

type TransactionItemProps = {
   transaction: Transaction;
   categories: Array<{ id: string; name: string; color: string; icon: string | null }>;
};

function TransactionItem({ transaction, categories }: TransactionItemProps) {
   const { selectedItems, handleSelectionChange } = useTransactionList();

   // Find the category details for this transaction
   const categoryDetails = categories.find(cat => cat.id === transaction.category);
   const categoryColor = categoryDetails?.color || "#6b7280";
   const categoryIcon = categoryDetails?.icon || "Wallet";
   const categoryName = categoryDetails?.name || transaction.category;

   const handleViewDetails = () => {
      // Navigate to transaction details - implement as needed
      console.log("View transaction details:", transaction.id);
   };

   const handleCreateContent = () => {
      // Create content related to transaction - implement as needed
      console.log("Create content for transaction:", transaction.id);
   };

   const dropdownItems = [
      {
         icon: <Eye className="h-4 w-4" />,
         label: "View Details",
         onClick: handleViewDetails,
      },
      {
         icon: <PlusIcon className="h-4 w-4" />,
         label: "Create Content",
         onClick: handleCreateContent,
      },
   ];

   return (
      <>
         <Item>
            <ItemMedia className="group relative">
               <div
                  className="size-8 rounded-sm border flex items-center justify-center"
                  style={{
                     backgroundColor: categoryColor,
                  }}
               >
                  <IconDisplay
                     className="text-white"
                     iconName={categoryIcon as IconName}
                     size={16}
                  />
               </div>
               <div
                  className={`absolute -top-1 -right-1 transition-opacity ${
                     selectedItems.has(transaction.id)
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100"
                  }`}
               >
                  <Checkbox
                     checked={selectedItems.has(transaction.id)}
                     className="size-4 border-2 border-background"
                     onCheckedChange={(checked) =>
                        handleSelectionChange(transaction.id, checked as boolean)
                     }
                  />
               </div>
            </ItemMedia>
            <ItemContent>
               <ItemTitle className="truncate">
                  {transaction.description}
               </ItemTitle>
               <ItemDescription className="truncate">
                  <div className="flex items-center gap-2">
                     <Badge className="text-xs font-normal" variant="outline">
                        {categoryName}
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
                     {transaction.type === "income" ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                  </div>
               </div>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     {dropdownItems.map((item, index) => (
                        <Fragment key={item.label}>
                           <DropdownMenuItem onClick={item.onClick}>
                              <span className="mr-2">{item.icon}</span>
                              {item.label}
                           </DropdownMenuItem>
                           {index < dropdownItems.length - 1 && (
                              <DropdownMenuSeparator />
                           )}
                        </Fragment>
                     ))}
                     <DropdownMenuSeparator />
                     <Suspense fallback={<DropdownMenuItem disabled>Loading...</DropdownMenuItem>}>
                        <EditTransactionSheet transaction={transaction} asChild />
                     </Suspense>
                     <DeleteTransaction transaction={transaction} asChild />
                  </DropdownMenuContent>
               </DropdownMenu>
            </ItemActions>
         </Item>
      </>
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
            <ItemGroup>
               {Array.from({ length: 5 }).map((index) => (
                  <Fragment key={`transaction-skeleton-${index + 1}`}>
                     <Item>
                        <ItemMedia className="group relative">
                           <Skeleton className="size-8 rounded-sm" />
                           <Skeleton className="absolute -top-1 -right-1 size-4 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                        </ItemMedia>
                        <ItemContent className="gap-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-48" />
                        </ItemContent>
                        <ItemActions>
                           <div className="text-right">
                              <Skeleton className="h-4 w-16 ml-auto mb-2" />
                           </div>
                           <Skeleton className="size-8" />
                        </ItemActions>
                     </Item>
                     {index !== 4 && <ItemSeparator />}
                  </Fragment>
               ))}
            </ItemGroup>
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

   const { data: categories = [] } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
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

   const transactionCategories = Array.from(
      new Set(uiTransactions.map((t) => t.category)),
   );

   const categoryOptions: ComboboxOption[] = [
      { label: "All Categories", value: "all" },
      ...transactionCategories.map((category) => ({ label: category, value: category })),
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
                  {paginatedTransactions.map((transaction, index) => (
                     <Fragment key={transaction.id}>
                        <TransactionItem
                           transaction={transaction}
                           categories={categories}
                        />
                        {index !== paginatedTransactions.length - 1 && <ItemSeparator />}
                     </Fragment>
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
         <TransactionListProvider>
            <Suspense fallback={<TransactionsListSkeleton />}>
               <TransactionsListContent />
            </Suspense>
         </TransactionListProvider>
      </ErrorBoundary>
   );
}

