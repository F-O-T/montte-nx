import type { BankAccount } from "@packages/database/repositories/bank-account-repository";
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
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
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
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import {
   keepPreviousData,
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { FileUp, MoreVertical, Plus, Trash2 } from "lucide-react";
import { Fragment, Suspense, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { ManageTransactionSheet } from "@/features/transaction/features/manage-transaction-sheet";
import {
   type Transaction,
   TransactionItem,
} from "@/features/transaction/ui/transaction-item";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { trpc, useTRPC } from "@/integrations/clients";
import { createTransactionColumns } from "@/pages/transactions/ui/transactions-table-columns";
import { DeleteBankAccount } from "../features/delete-bank-account";

function RecentTransactionsErrorFallback() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.transactions.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.transactions.list-section.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="text-center py-4 text-muted-foreground">
               {translate(
                  "dashboard.routes.transactions.list-section.state.empty.title",
               )}
            </div>
         </CardContent>
      </Card>
   );
}

function RecentTransactionsSkeleton() {
   return (
      <Card className="w-full">
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.transactions.list-section.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.transactions.list-section.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
            </div>
         </CardContent>
      </Card>
   );
}

function RecentTransactionsContent({
   bankAccountId,
}: {
   bankAccountId: string;
}) {
   const isMobile = useIsMobile();
   const { activeOrganization } = useActiveOrganization();
   const [currentPage, setCurrentPage] = useState(1);
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [isImporting, setIsImporting] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const router = useRouter();
   const queryClient = useQueryClient();
   const pageSize = 10;

   const trpcClient = useTRPC();
   const { data } = useSuspenseQuery(
      trpcClient.bankAccounts.getTransactions.queryOptions(
         {
            id: bankAccountId,
            limit: pageSize,
            page: currentPage,
         },
         {
            placeholderData: keepPreviousData,
         },
      ),
   );

   const { data: bankAccount } = useSuspenseQuery(
      trpcClient.bankAccounts.getById.queryOptions({ id: bankAccountId }),
   );

   const { transactions, pagination } = data;
   const { totalPages } = pagination;

   const { data: categories = [] } = useSuspenseQuery(
      trpcClient.categories.getAll.queryOptions(),
   );

   const parseOfxMutation = useMutation(
      trpc.bankAccounts.parseOfx.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao importar arquivo OFX", {
               id: "ofx-import",
            });
            setIsImporting(false);
         },
         onSuccess: async (data) => {
            await queryClient.invalidateQueries({
               queryKey: trpcClient.bankAccounts.getTransactions.queryKey(),
            });
            await queryClient.invalidateQueries({
               queryKey: trpcClient.bankAccounts.getStats.queryKey(),
            });
            toast.success(`${data.length} transacoes importadas com sucesso!`, {
               id: "ofx-import",
            });
            setIsImporting(false);
         },
      }),
   );

   const handleImportOfx = () => {
      fileInputRef.current?.click();
   };

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith(".ofx")) {
         toast.error("Por favor, selecione um arquivo OFX valido");
         return;
      }

      setIsImporting(true);
      toast.loading("Importando arquivo OFX...", { id: "ofx-import" });

      try {
         const content = await file.text();
         await parseOfxMutation.mutateAsync({
            bankAccountId,
            content,
         });
      } catch (error) {
         console.error("Error reading file:", error);
      }

      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
   };

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/bank-accounts",
      });
   };

   const hasTransactions = transactions.length > 0;

   return (
      <>
         <Card className="w-full">
            <CardHeader>
               <CardTitle>
                  {translate(
                     "dashboard.routes.transactions.list-section.title",
                  )}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.transactions.list-section.description",
                  )}
               </CardDescription>
               <CardAction>
                  <div className="flex items-center gap-2">
                     <Button
                        className="hidden sm:flex"
                        onClick={() => setIsCreateSheetOpen(true)}
                        size="sm"
                     >
                        <Plus className="size-4 mr-2" />
                        Nova Transacao
                     </Button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button size="icon" variant="outline">
                              <MoreVertical className="size-4" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                           <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem
                              disabled={isImporting}
                              onClick={handleImportOfx}
                           >
                              <FileUp className="size-4" />
                              {isImporting ? "Importando..." : "Importar OFX"}
                           </DropdownMenuItem>
                           <DropdownMenuSeparator />
                           <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setIsDeleteOpen(true)}
                           >
                              <Trash2 className="size-4" />
                              Excluir Conta
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </div>
               </CardAction>
            </CardHeader>
            <CardContent>
               {!hasTransactions ? (
                  <div className="text-center py-8 text-muted-foreground">
                     {translate(
                        "dashboard.routes.transactions.list-section.state.empty.title",
                     )}
                  </div>
               ) : isMobile ? (
                  <ItemGroup>
                     {transactions.map(
                        (transaction: Transaction, index: number) => (
                           <Fragment key={transaction.id}>
                              <TransactionItem
                                 categories={categories}
                                 transaction={transaction}
                              />
                              {index !== transactions.length - 1 && (
                                 <ItemSeparator />
                              )}
                           </Fragment>
                        ),
                     )}
                  </ItemGroup>
               ) : (
                  <DataTable
                     columns={createTransactionColumns(
                        categories,
                        activeOrganization.slug,
                     )}
                     data={transactions}
                  />
               )}
            </CardContent>

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

            {totalPages > 1 && (
               <CardFooter className="hidden md:flex md:items-center md:justify-between">
                  <div className="text-sm text-muted-foreground">
                     {translate(
                        "dashboard.routes.transactions.list-section.showing",
                        {
                           count: transactions.length,
                           total: pagination.totalCount,
                        },
                     )}
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                     <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                        {translate(
                           "dashboard.routes.transactions.list-section.page",
                           {
                              current: currentPage,
                              total: totalPages,
                           },
                        )}
                     </div>
                     <div className="flex items-center space-x-2">
                        <Button
                           className="hidden h-8 w-8 p-0 lg:flex"
                           disabled={currentPage === 1}
                           onClick={() => setCurrentPage(1)}
                           variant="outline"
                        >
                           <span className="sr-only">
                              {translate("common.actions.first-page")}
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
                           <span className="sr-only">
                              {translate("common.actions.previous-page")}
                           </span>
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
                           <span className="sr-only">
                              {translate("common.actions.next-page")}
                           </span>
                           {">"}
                        </Button>
                        <Button
                           className="hidden h-8 w-8 p-0 lg:flex"
                           disabled={currentPage === totalPages}
                           onClick={() => setCurrentPage(totalPages)}
                           variant="outline"
                        >
                           <span className="sr-only">
                              {translate("common.actions.last-page")}
                           </span>
                           {">>"}
                        </Button>
                     </div>
                  </div>
               </CardFooter>
            )}
         </Card>

         <input
            accept=".ofx"
            className="hidden"
            onChange={handleFileChange}
            ref={fileInputRef}
            type="file"
         />

         <ManageTransactionSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />

         <DeleteBankAccount
            bankAccount={bankAccount as BankAccount}
            onSuccess={handleDeleteSuccess}
            open={isDeleteOpen}
            setOpen={setIsDeleteOpen}
         />

         {isMobile && (
            <Button
               className="fixed bottom-6 right-6 size-14 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-lg z-50"
               onClick={() => setIsCreateSheetOpen(true)}
               size="icon"
            >
               <Plus className="size-6" />
            </Button>
         )}
      </>
   );
}

export function RecentTransactions({
   bankAccountId,
}: {
   bankAccountId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={RecentTransactionsErrorFallback}>
         <Suspense fallback={<RecentTransactionsSkeleton />}>
            <RecentTransactionsContent bankAccountId={bankAccountId} />
         </Suspense>
      </ErrorBoundary>
   );
}
