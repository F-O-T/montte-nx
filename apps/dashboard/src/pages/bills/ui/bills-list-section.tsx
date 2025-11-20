import type { Bill } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import {
   getRecurrenceLabel,
   type RecurrencePattern,
} from "@packages/utils/recurrence";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuLabel,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   InputGroup,
   InputGroupAddon,
   InputGroupInput,
} from "@packages/ui/components/input-group";
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
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
   Filter,
   MoreVertical,
   Pencil,
   Receipt,
   Search,
   Trash2,
   Wallet,
} from "lucide-react";
import { Fragment, Suspense, useEffect } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { trpc } from "@/integrations/clients";
import type { Category } from "@/pages/categories/ui/categories-page";
import { CompleteBillDialog } from "../features/complete-bill-dialog";
import { BillFilterSheet } from "../features/bill-filter-sheet";
import { DeleteBillDialog } from "../features/delete-bill-dialog";
import { ManageBillSheet } from "../features/manage-bill-sheet";
import { useBillList } from "../features/bill-list-context";
import { useState } from "react";

type BillsListSectionProps = {
   type?: "payable" | "receivable";
};

type BillItemProps = {
   bill: Bill;
   categories: Category[];
};

function BillItem({ bill, categories }: BillItemProps) {
   const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
   const today = new Date();
   today.setHours(0, 0, 0, 0);

   const isOverdue =
      bill.dueDate && !bill.completionDate && new Date(bill.dueDate) < today;
   const statusColor = isOverdue
      ? "destructive"
      : bill.type === "expense"
        ? "secondary"
        : "default";

   const categoryDetails = categories.find((cat) => cat.name === bill.category);
   const categoryColor = categoryDetails?.color || "#6b7280";
   const categoryIcon = categoryDetails?.icon || "Wallet";

   return (
      <>
         <Item>
            <ItemMedia
               variant="icon"
               style={{
                  backgroundColor: categoryColor,
               }}
            >
               <IconDisplay iconName={categoryIcon as IconName} size={16} />
            </ItemMedia>
            <ItemContent>
               <ItemTitle className="truncate flex items-center gap-2">
                  {bill.description}
                  {bill.isRecurring && bill.recurrencePattern && (
                     <Badge variant="outline" className="text-xs">
                        {getRecurrenceLabel(
                           bill.recurrencePattern as RecurrencePattern,
                        )}
                     </Badge>
                  )}
                  {isOverdue && (
                     <Badge variant="destructive" className="text-xs">
                        {translate("dashboard.routes.bills.overdue")}
                     </Badge>
                  )}
               </ItemTitle>
               <ItemDescription>
                  {translate("dashboard.routes.bills.dueDate")}:{" "}
                  {bill.dueDate
                     ? format(new Date(bill.dueDate), "dd/MM/yyyy")
                     : "-"}
                  {bill.completionDate && (
                     <>
                        {" • "}
                        {translate("dashboard.routes.bills.completedOn")}:{" "}
                        {format(new Date(bill.completionDate), "dd/MM/yyyy")}
                     </>
                  )}
               </ItemDescription>
            </ItemContent>
            <ItemActions>
               <Badge
                  variant={statusColor}
                  className={bill.completionDate ? "opacity-60" : ""}
               >
                  R$ {parseFloat(bill.amount).toFixed(2)}
               </Badge>
               <DropdownMenu>
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                           <Button
                              aria-label={translate(
                                 "dashboard.routes.bills.actions.label",
                              )}
                              size="icon"
                              variant="ghost"
                           >
                              <MoreVertical className="size-4" />
                           </Button>
                        </DropdownMenuTrigger>
                     </TooltipTrigger>
                     <TooltipContent>
                        {translate("dashboard.routes.bills.actions.label")}
                     </TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                     <DropdownMenuLabel>
                        {translate("dashboard.routes.bills.actions.label")}
                     </DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     {!bill.completionDate && (
                        <CompleteBillDialog bill={bill}>
                           <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Wallet className="size-4 mr-2" />
                              {bill.type === "expense"
                                 ? translate("dashboard.routes.bills.actions.pay")
                                 : translate(
                                      "dashboard.routes.bills.actions.receive",
                                   )}
                           </DropdownMenuItem>
                        </CompleteBillDialog>
                     )}
                     <DropdownMenuItem
                        onClick={() => setIsEditSheetOpen(true)}
                        onSelect={(e) => e.preventDefault()}
                     >
                        <Pencil className="size-4 mr-2" />
                        {translate("dashboard.routes.bills.actions.edit")}
                     </DropdownMenuItem>
                     <DeleteBillDialog bill={bill}>
                        <DropdownMenuItem
                           className="text-destructive focus:text-destructive"
                           onSelect={(e) => e.preventDefault()}
                        >
                           <Trash2 className="size-4 mr-2" />
                           {translate("dashboard.routes.bills.actions.delete")}
                        </DropdownMenuItem>
                     </DeleteBillDialog>
                  </DropdownMenuContent>
               </DropdownMenu>
            </ItemActions>
         </Item>
         <ManageBillSheet
            bill={bill}
            onOpen={isEditSheetOpen}
            onOpenChange={setIsEditSheetOpen}
         />
      </>
   );
}

function BillsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.bills.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.bills.list-section.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription:
                  "Failed to load bills. Please try again later.",
               errorTitle: "Error loading bills",
               retryText: "Retry",
            })(props)}
         </CardContent>
      </Card>
   );
}

function BillsListSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.bills.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.bills.list-section.description")}
            </CardDescription>
            <div className="flex items-center gap-3 pt-4">
               <div className="relative flex-1 max-w-md">
                  <Skeleton className="h-10 w-full" />
               </div>
               <Skeleton className="ml-auto h-10 w-10" />
            </div>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               {Array.from({ length: 5 }).map((_, index) => (
                  <Fragment key={`bill-skeleton-${index + 1}`}>
                     <Item>
                        <ItemMedia variant="icon">
                           <div className="size-8 rounded-sm border group relative">
                              <Skeleton className="size-8 rounded-sm" />
                              <Skeleton className="absolute -top-1 -right-1 size-4 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
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

function BillsListContent({ type }: BillsListSectionProps) {
   const {
      setCurrentFilterType,
      selectedMonth,
      setSelectedMonth,
      currentPage,
      setCurrentPage,
      searchTerm,
      setSearchTerm,
      categoryFilter,
      statusFilter,
      typeFilter,
      setIsFilterSheetOpen,
   } = useBillList();
   const pageSize = 5;

   const formattedMonth = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;

   // Set the context filter type based on the component prop
   useEffect(() => {
      setCurrentFilterType(type);
   }, [type, setCurrentFilterType]);

   // Get bills data with server-side filtering
   const billType =
      type === "payable"
         ? "expense"
         : type === "receivable"
           ? "income"
           : undefined;
   const { data: allBills = [] } = useSuspenseQuery(
      trpc.bills.getAll.queryOptions({
         month: formattedMonth,
         type: billType,
      }),
   );

   const { data: categories = [] } = useSuspenseQuery(
      trpc.categories.getAll.queryOptions(),
   );

   // Apply filters like transactions
   const filteredBills = allBills.filter((bill) => {
      const matchesSearch =
         bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
         bill.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
         categoryFilter === "all" || bill.category === categoryFilter;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isOverdue =
         bill.dueDate && !bill.completionDate && new Date(bill.dueDate) < today;
      const isPending = !bill.completionDate && !isOverdue;

      let matchesStatus = true;
      if (statusFilter === "pending") {
         matchesStatus = isPending;
      } else if (statusFilter === "overdue") {
         matchesStatus = isOverdue;
      } else if (statusFilter === "completed") {
         matchesStatus = !!bill.completionDate;
      }

      const matchesType =
         typeFilter === "all" ||
         (typeFilter === "payable" && bill.type === "expense") ||
         (typeFilter === "receivable" && bill.type === "income");

      return matchesSearch && matchesCategory && matchesStatus && matchesType;
   });

   // Pagination logic
   const totalPages = Math.ceil(filteredBills.length / pageSize);
   const startIndex = (currentPage - 1) * pageSize;
   const paginatedBills = filteredBills.slice(
      startIndex,
      startIndex + pageSize,
   );

   // Reset to first page when filters change
   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const hasActiveFilters =
      categoryFilter !== "all" ||
      statusFilter !== "all" ||
      typeFilter !== "all";

   return (
      <>
         <Card>
            <CardHeader>
               <div>
                  <CardTitle>
                     {type === "payable"
                        ? translate("dashboard.routes.bills.payables.title")
                        : type === "receivable"
                          ? translate(
                               "dashboard.routes.bills.receivables.title",
                            )
                          : translate("dashboard.routes.bills.allBills.title")}
                  </CardTitle>
                  <CardDescription>
                     {type === "payable"
                        ? translate(
                             "dashboard.routes.bills.payables.description",
                          )
                        : type === "receivable"
                          ? translate(
                               "dashboard.routes.bills.receivables.description",
                            )
                          : translate(
                               "dashboard.routes.bills.allBills.description",
                            )}
                  </CardDescription>
               </div>
            </CardHeader>
            <CardContent className="grid gap-2">
               <div className="flex items-center justify-between gap-8">
                  <InputGroup>
                     <InputGroupInput
                        onChange={(e) => {
                           setSearchTerm(e.target.value);
                           handleFilterChange();
                        }}
                        placeholder={translate(
                           "common.form.search.placeholder",
                        )}
                        value={searchTerm}
                     />
                     <InputGroupAddon>
                        <Search />
                     </InputGroupAddon>
                  </InputGroup>
                  <Button
                     onClick={() => setIsFilterSheetOpen(true)}
                     size="icon"
                     variant={hasActiveFilters ? "default" : "outline"}
                  >
                     <Filter className="size-4" />
                  </Button>
               </div>

               {paginatedBills.length === 0 ? (
                  <Empty>
                     <EmptyContent>
                        <EmptyMedia variant="icon">
                           <Receipt />
                        </EmptyMedia>
                        <EmptyTitle>
                           {translate(
                              "dashboard.routes.bills.list-section.state.empty.title",
                           )}
                        </EmptyTitle>
                        <EmptyDescription>
                           {translate(
                              "dashboard.routes.bills.list-section.state.empty.description",
                           )}
                        </EmptyDescription>
                     </EmptyContent>
                  </Empty>
               ) : (
                  <ItemGroup>
                     {paginatedBills.map((bill, index) => (
                        <Fragment key={bill.id}>
                           <BillItem bill={bill} categories={categories} />
                           {index !== paginatedBills.length - 1 && (
                              <ItemSeparator />
                           )}
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
                                    return newPage <= totalPages
                                       ? newPage
                                       : prev;
                                 })
                              }
                           />
                        </PaginationItem>
                     </PaginationContent>
                  </Pagination>
               </CardFooter>
            )}
         </Card>
         <BillFilterSheet categories={categories} />
      </>
   );
}

export function BillsListSection({ type }: BillsListSectionProps) {
   return (
      <ErrorBoundary FallbackComponent={BillsListErrorFallback}>
         <Suspense fallback={<BillsListSkeleton />}>
            <BillsListContent type={type} />
         </Suspense>
      </ErrorBoundary>
   );
}
