import type { Bill } from "@packages/database/repositories/bill-repository";
import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import {
   getRecurrenceLabel,
   type RecurrencePattern,
} from "@packages/utils/recurrence";
import { useSuspenseQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import {
   Filter,
   MoreVertical,
   Pencil,
   Plus,
   Receipt,
   Search,
   Trash2,
   Wallet,
} from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { trpc } from "@/integrations/clients";
import type { Category } from "@/pages/categories/ui/categories-page";
import { BillFilterSheet } from "../features/bill-filter-sheet";
import { useBillList } from "../features/bill-list-context";
import { CompleteBillDialog } from "../features/complete-bill-dialog";
import { DeleteBillDialog } from "../features/delete-bill-dialog";
import { ManageBillSheet } from "../features/manage-bill-sheet";
import { createBillColumns } from "./bills-table-columns";

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

   const categoryDetails = categories.find((cat) => cat.id === bill.categoryId);
   const categoryColor = categoryDetails?.color || "#6b7280";
   const categoryIcon = categoryDetails?.icon || "Wallet";

   return (
      <>
         <Item>
            <ItemMedia
               style={{
                  backgroundColor: categoryColor,
               }}
               variant="icon"
            >
               <IconDisplay iconName={categoryIcon as IconName} size={16} />
            </ItemMedia>
            <ItemContent>
               <ItemTitle className="truncate flex items-center gap-2">
                  {bill.description}
                  {bill.isRecurring && bill.recurrencePattern && (
                     <Badge className="text-[10px] h-5 px-1" variant="outline">
                        {getRecurrenceLabel(
                           bill.recurrencePattern as RecurrencePattern,
                        )}
                     </Badge>
                  )}
                  {isOverdue && (
                     <Badge
                        className="text-[10px] h-5 px-1"
                        variant="destructive"
                     >
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
                  className={bill.completionDate ? "opacity-60" : ""}
                  variant={statusColor}
               >
                  {bill.type === "expense" ? "-" : "+"}
                  {parseFloat(bill.amount).toFixed(2)}
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
                           <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                           >
                              <Wallet className="size-4 mr-2" />
                              {bill.type === "expense"
                                 ? translate(
                                      "dashboard.routes.bills.actions.pay",
                                   )
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
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const {
      setCurrentFilterType,
      currentPage,
      setCurrentPage,
      searchTerm,
      setSearchTerm,
      categoryFilter,
      statusFilter,
      typeFilter,
      setIsFilterSheetOpen,
      startDate,
      endDate,
      pageSize,
   } = useBillList();

   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   // Set the context filter type based on the component prop
   useEffect(() => {
      setCurrentFilterType(type);
   }, [type, setCurrentFilterType]);

   const billType =
      type === "payable"
         ? "expense"
         : type === "receivable"
           ? "income"
           : undefined;

   const [billsQuery, categoriesQuery] = useSuspenseQueries({
      queries: [
         trpc.bills.getAllPaginated.queryOptions({
            endDate: endDate?.toISOString(),
            limit: pageSize,
            month: undefined, // We use startDate/endDate now
            orderBy: "dueDate",
            orderDirection: "asc",
            page: currentPage,
            search: debouncedSearchTerm || undefined,
            startDate: startDate?.toISOString(),
            type:
               billType ??
               (typeFilter !== "all"
                  ? (typeFilter as "income" | "expense")
                  : undefined),
         }),
         trpc.categories.getAll.queryOptions(),
      ],
   });

   const { bills, pagination } = billsQuery.data;
   const { totalPages } = pagination;
   const categories = categoriesQuery.data ?? [];

   const filteredBills = bills.filter((bill) => {
      const matchesCategory =
         categoryFilter === "all" || bill.categoryId === categoryFilter;

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

      return matchesCategory && matchesStatus;
   });

   const { title, description } = (() => {
      if (type === "payable") {
         return {
            description: translate(
               "dashboard.routes.bills.views.payables.description",
            ),
            title: translate("dashboard.routes.bills.views.payables.title"),
         };
      }

      if (type === "receivable") {
         return {
            description: translate(
               "dashboard.routes.bills.views.receivables.description",
            ),
            title: translate("dashboard.routes.bills.views.receivables.title"),
         };
      }

      return {
         description: translate(
            "dashboard.routes.bills.views.allBills.description",
         ),
         title: translate("dashboard.routes.bills.views.allBills.title"),
      };
   })();

   const hasActiveFilters =
      categoryFilter !== "all" ||
      statusFilter !== "all" ||
      typeFilter !== "all" ||
      startDate !== undefined ||
      endDate !== undefined;

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>{title}</CardTitle>
               <CardDescription>{description}</CardDescription>
               <CardAction className="hidden md:flex">
                  <Button onClick={() => setIsCreateSheetOpen(true)} size="sm">
                     <Plus className="size-4 mr-2" />
                     {translate(
                        "dashboard.routes.bills.actions-toolbar.actions.add-new",
                     )}
                  </Button>
               </CardAction>
            </CardHeader>
            <CardContent className="grid gap-2">
               <div className="flex items-center justify-between gap-8">
                  <InputGroup>
                     <InputGroupInput
                        onChange={(e) => {
                           setSearchTerm(e.target.value);
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
                  <Tooltip>
                     <TooltipTrigger asChild>
                        <Button
                           onClick={() => setIsFilterSheetOpen(true)}
                           size="icon"
                           variant={hasActiveFilters ? "default" : "outline"}
                        >
                           <Filter className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                        <p>Filter bills</p>
                     </TooltipContent>
                  </Tooltip>
               </div>

               {/* Mobile View */}
               <div className="block md:hidden">
                  {filteredBills.length === 0 ? (
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
                        {filteredBills.map((bill, index) => (
                           <Fragment key={bill.id}>
                              <BillItem bill={bill} categories={categories} />
                              {index !== filteredBills.length - 1 && (
                                 <ItemSeparator />
                              )}
                           </Fragment>
                        ))}
                     </ItemGroup>
                  )}
               </div>

               <div className="hidden md:block">
                  {filteredBills.length === 0 ? (
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
                     <DataTable
                        columns={createBillColumns(categories)}
                        data={filteredBills}
                     />
                  )}
               </div>
            </CardContent>

            {/* Pagination Mobile */}
            {totalPages > 1 && (
               <CardFooter className="block md:hidden">
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
                              onClick={(e) => {
                                 e.preventDefault();
                                 setCurrentPage(Math.max(1, currentPage - 1));
                              }}
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
                                 onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentPage(pageNum);
                                 }}
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
                              onClick={(e) => {
                                 e.preventDefault();
                                 setCurrentPage(
                                    Math.min(totalPages, currentPage + 1),
                                 );
                              }}
                           />
                        </PaginationItem>
                     </PaginationContent>
                  </Pagination>
               </CardFooter>
            )}

            {/* Pagination Desktop */}
            {totalPages > 1 && (
               <CardFooter className="hidden md:flex md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                     Mostrando {filteredBills.length} de {pagination.totalCount}{" "}
                     contas
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                     <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        Página {currentPage} de {totalPages}
                     </div>
                     <div className="flex items-center space-x-2">
                        <Button
                           className="hidden h-8 w-8 p-0 lg:flex"
                           disabled={currentPage === 1}
                           onClick={() => setCurrentPage(1)}
                           variant="outline"
                        >
                           <span className="sr-only">
                              Ir para primeira página
                           </span>
                           {"<<"}
                        </Button>
                        <Button
                           className="h-8 w-8 p-0"
                           disabled={currentPage === 1}
                           onClick={() =>
                              setCurrentPage((prev) => Math.max(1, prev - 1))
                           }
                           variant="outline"
                        >
                           <span className="sr-only">Página anterior</span>
                           {"<"}
                        </Button>
                        <Button
                           className="h-8 w-8 p-0"
                           disabled={currentPage === totalPages}
                           onClick={() =>
                              setCurrentPage((prev) =>
                                 Math.min(totalPages, prev + 1),
                              )
                           }
                           variant="outline"
                        >
                           <span className="sr-only">Próxima página</span>
                           {">"}
                        </Button>
                        <Button
                           className="hidden h-8 w-8 p-0 lg:flex"
                           disabled={currentPage === totalPages}
                           onClick={() => setCurrentPage(totalPages)}
                           variant="outline"
                        >
                           <span className="sr-only">
                              Ir para última página
                           </span>
                           {">>"}
                        </Button>
                     </div>
                  </div>
               </CardFooter>
            )}
         </Card>
         <BillFilterSheet categories={categories} />

         {/* Mobile Floating Action Button */}
         <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow md:hidden"
            onClick={() => setIsCreateSheetOpen(true)}
            size="icon"
         >
            <Plus className="size-6" />
         </Button>

         <ManageBillSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
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
