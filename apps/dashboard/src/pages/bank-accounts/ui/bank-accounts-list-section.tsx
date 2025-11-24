import { translate } from "@packages/localization";
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
   ItemGroup,
   ItemMedia,
   ItemSeparator,
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { Building, Filter, Plus, Search } from "lucide-react";
import { Fragment, Suspense, useEffect, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { BankAccountItem } from "@/features/bank-account/ui/bank-account-item";
import { ManageBankAccountSheet } from "@/features/bank-account/ui/manage-bank-account-sheet";
import { trpc } from "@/integrations/clients";
import { createBankAccountColumns } from "./bank-accounts-table-columns";

function BankAccountsListErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.bank-accounts.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.bank-accounts.list-section.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription:
                  "Failed to load bank accounts. Please try again later.",
               errorTitle: "Error loading bank accounts",
               retryText: "Retry",
            })(props)}
         </CardContent>
      </Card>
   );
}

function BankAccountsListSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.bank-accounts.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.bank-accounts.list-section.description",
               )}
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
                  <Fragment key={`bank-account-skeleton-${index + 1}`}>
                     <Item>
                        <div className="size-8 rounded-sm border group relative">
                           <Skeleton className="size-8 rounded-sm" />
                           <Skeleton className="absolute -top-1 -right-1 size-4 rounded opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
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

function BankAccountsListContent() {
   const [currentPage, setCurrentPage] = useState(1);
   const [searchTerm, setSearchTerm] = useState("");
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const [pageSize, setPageSize] = useState(5);
   const [statusFilter, setStatusFilter] = useState<
      "all" | "active" | "inactive"
   >("all");
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   const { data: bankAccounts } = useSuspenseQuery(
      trpc.bankAccounts.getAll.queryOptions(),
   );

   const filteredAccounts = bankAccounts.filter((account) => {
      const matchesSearch =
         account.name
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
         account.bank
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
         account.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus =
         statusFilter === "all" || account.status === statusFilter;

      return matchesSearch && matchesStatus;
   });

   const totalPages = Math.ceil(filteredAccounts.length / pageSize);
   const paginatedAccounts = filteredAccounts.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize,
   );

   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const hasActiveFilters = statusFilter !== "all";

   if (bankAccounts.length === 0) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.description",
                  )}
               </CardDescription>
               <CardAction className="hidden md:flex">
                  <Button onClick={() => setIsCreateSheetOpen(true)} size="sm">
                     <Plus className="size-4 mr-2" />
                     {translate(
                        "dashboard.routes.transactions.actions-toolbar.actions.add-new",
                     )}
                  </Button>
               </CardAction>
            </CardHeader>
            <CardContent>
               <Empty>
                  <EmptyContent>
                     <EmptyMedia variant="icon">
                        <Building className="size-12 text-muted-foreground" />
                     </EmptyMedia>
                     <EmptyTitle>
                        {translate(
                           "dashboard.routes.bank-accounts.list-section.state.empty.title",
                        )}
                     </EmptyTitle>
                     <EmptyDescription>
                        {translate(
                           "dashboard.routes.bank-accounts.list-section.state.empty.description",
                        )}
                     </EmptyDescription>
                     <div className="mt-6">
                        <Button
                           onClick={() => setIsCreateSheetOpen(true)}
                           size="default"
                        >
                           <Plus className="size-4 mr-2" />
                           {translate(
                              "dashboard.routes.transactions.actions-toolbar.actions.add-new",
                           )}
                        </Button>
                     </div>
                  </EmptyContent>
               </Empty>
            </CardContent>
            <ManageBankAccountSheet
               onOpen={isCreateSheetOpen}
               onOpenChange={setIsCreateSheetOpen}
            />
         </Card>
      );
   }

   return (
      <>
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.description",
                  )}
               </CardDescription>
               <CardAction className="hidden md:flex">
                  <Button onClick={() => setIsCreateSheetOpen(true)} size="sm">
                     <Plus className="size-4 mr-2" />
                     {translate(
                        "dashboard.routes.transactions.actions-toolbar.actions.add-new",
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
                           onClick={() =>
                              setStatusFilter(
                                 statusFilter === "all" ? "active" : "all",
                              )
                           }
                           size="icon"
                           variant={hasActiveFilters ? "default" : "outline"}
                        >
                           <Filter className="size-4" />
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                        <p>Filter bank accounts</p>
                     </TooltipContent>
                  </Tooltip>
               </div>

               {/* Mobile View - menor que md */}
               <div className="block md:hidden">
                  {paginatedAccounts.length === 0 ? (
                     <Empty>
                        <EmptyContent>
                           <EmptyMedia variant="icon">
                              <Building />
                           </EmptyMedia>
                           <EmptyTitle>
                              {translate(
                                 "dashboard.routes.bank-accounts.list-section.state.empty.title",
                              )}
                           </EmptyTitle>
                           <EmptyDescription>
                              {translate(
                                 "dashboard.routes.bank-accounts.list-section.state.empty.description",
                              )}
                           </EmptyDescription>
                        </EmptyContent>
                     </Empty>
                  ) : (
                     <ItemGroup>
                        {paginatedAccounts.map((account, index) => (
                           <Fragment key={account.id}>
                              <BankAccountItem account={account} />
                              {index !== paginatedAccounts.length - 1 && (
                                 <ItemSeparator />
                              )}
                           </Fragment>
                        ))}
                     </ItemGroup>
                  )}
               </div>

               {/* Desktop View - md ou maior */}
               <div className="hidden md:block">
                  {filteredAccounts.length === 0 ? (
                     <Empty>
                        <EmptyContent>
                           <EmptyMedia variant="icon">
                              <Building />
                           </EmptyMedia>
                           <EmptyTitle>
                              {translate(
                                 "dashboard.routes.bank-accounts.list-section.state.empty.title",
                              )}
                           </EmptyTitle>
                           <EmptyDescription>
                              {translate(
                                 "dashboard.routes.bank-accounts.list-section.state.empty.description",
                              )}
                           </EmptyDescription>
                        </EmptyContent>
                     </Empty>
                  ) : (
                     <DataTable
                        columns={createBankAccountColumns()}
                        data={filteredAccounts}
                     />
                  )}
               </div>
            </CardContent>
            {/* Paginação Mobile */}
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
                                 setCurrentPage((prev) =>
                                    Math.max(1, prev - 1),
                                 );
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
                                 setCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1),
                                 );
                              }}
                           />
                        </PaginationItem>
                     </PaginationContent>
                  </Pagination>
               </CardFooter>
            )}

            {/* Paginação Desktop */}
            {totalPages > 1 && (
               <CardFooter className="hidden md:flex md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                     Mostrando {paginatedAccounts.length} de{" "}
                     {filteredAccounts.length} contas bancárias
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

         {/* Mobile Floating Action Button */}
         <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow md:hidden"
            onClick={() => setIsCreateSheetOpen(true)}
            size="icon"
         >
            <Plus className="size-6" />
         </Button>

         <ManageBankAccountSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </>
   );
}

export function BankAccountsListSection() {
   return (
      <ErrorBoundary FallbackComponent={BankAccountsListErrorFallback}>
         <Suspense fallback={<BankAccountsListSkeleton />}>
            <BankAccountsListContent />
         </Suspense>
      </ErrorBoundary>
   );
}
