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
import { ItemGroup, ItemSeparator } from "@packages/ui/components/item";
import {
   Pagination,
   PaginationContent,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
} from "@packages/ui/components/pagination";
import { Skeleton } from "@packages/ui/components/skeleton";
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import { Building, Plus, Search } from "lucide-react";
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
                     <div className="flex items-center p-4 gap-4">
                        <Skeleton className="size-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                           <Skeleton className="h-4 w-32" />
                           <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                     </div>
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
   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const pageSize = 10;

   useEffect(() => {
      const timer = setTimeout(() => {
         setDebouncedSearchTerm(searchTerm);
         setCurrentPage(1);
      }, 300);
      return () => clearTimeout(timer);
   }, [searchTerm]);

   const { data: paginatedData } = useSuspenseQuery(
      trpc.bankAccounts.getAllPaginated.queryOptions(
         {
            limit: pageSize,
            page: currentPage,
            search: debouncedSearchTerm || undefined,
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { bankAccounts, pagination } = paginatedData;
   const { totalPages, totalCount } = pagination;

   if (bankAccounts.length === 0 && !debouncedSearchTerm) {
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
               <div className="flex items-center gap-3">
                  <InputGroup className="flex-1 max-w-md">
                     <InputGroupInput
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={translate(
                           "common.form.search.placeholder",
                        )}
                        value={searchTerm}
                     />
                     <InputGroupAddon>
                        <Search />
                     </InputGroupAddon>
                  </InputGroup>
               </div>

               <div className="block md:hidden">
                  {bankAccounts.length === 0 ? (
                     <div className="py-8 text-center text-muted-foreground">
                        {translate(
                           "dashboard.routes.bank-accounts.list-section.state.empty.title",
                        )}
                     </div>
                  ) : (
                     <ItemGroup>
                        {bankAccounts.map((account, index) => (
                           <Fragment key={account.id}>
                              <BankAccountItem account={account} />
                              {index !== bankAccounts.length - 1 && (
                                 <ItemSeparator />
                              )}
                           </Fragment>
                        ))}
                     </ItemGroup>
                  )}
               </div>

               <div className="hidden md:block">
                  {bankAccounts.length === 0 ? (
                     <div className="py-8 text-center text-muted-foreground">
                        {translate(
                           "dashboard.routes.bank-accounts.list-section.state.empty.title",
                        )}
                     </div>
                  ) : (
                     <DataTable
                        columns={createBankAccountColumns()}
                        data={bankAccounts}
                     />
                  )}
               </div>
            </CardContent>

            {totalPages > 1 && (
               <CardFooter className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground hidden md:block">
                     {translate(
                        "dashboard.routes.transactions.list-section.showing",
                        {
                           count: bankAccounts.length,
                           total: totalCount,
                        },
                     )}
                  </div>
                  <div className="flex-1 flex items-center justify-center md:justify-end space-x-6 lg:space-x-8">
                     <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        {translate(
                           "dashboard.routes.transactions.list-section.page",
                           {
                              current: currentPage,
                              total: totalPages,
                           },
                        )}
                     </div>
                     <Pagination className="w-auto">
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
                  </div>
               </CardFooter>
            )}
         </Card>

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
