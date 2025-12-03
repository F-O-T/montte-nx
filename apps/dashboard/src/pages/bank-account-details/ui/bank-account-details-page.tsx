import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { MonthSelector } from "@packages/ui/components/month-selector";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   getDateRangeForPeriod,
   type TimePeriod,
   TimePeriodChips,
   type TimePeriodDateRange,
} from "@packages/ui/components/time-period-chips";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { endOfMonth, startOfMonth } from "date-fns";
import {
   Building,
   ChevronDown,
   Edit,
   FileSpreadsheet,
   Home,
   Plus,
   Trash2,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { ManageBankAccountSheet } from "@/features/bank-account/ui/manage-bank-account-sheet";
import { ManageTransactionSheet } from "@/features/transaction/features/manage-transaction-sheet";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { DeleteBankAccount } from "../features/delete-bank-account";
import { ImportOfxSheet } from "../features/import-ofx-sheet";
import { BankAccountCharts } from "./bank-account-charts";
import { RecentTransactions } from "./bank-account-recent-transactions-section";
import { BankAccountStats } from "./bank-account-stats";

function BankAccountContent() {
   const params = useParams({ strict: false });
   const bankAccountId =
      (params as { bankAccountId?: string }).bankAccountId ?? "";
   const trpc = useTRPC();
   const [isCreateTransactionOpen, setIsCreateTransactionOpen] =
      useState(false);
   const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
   const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
   const [isImportOfxOpen, setIsImportOfxOpen] = useState(false);
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const [timePeriod, setTimePeriod] = useState<TimePeriod | null>(
      "this-month",
   );
   const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
   const [dateRange, setDateRange] = useState<{
      startDate: Date | null;
      endDate: Date | null;
   }>(() => {
      const range = getDateRangeForPeriod("this-month");
      return { endDate: range.endDate, startDate: range.startDate };
   });

   const handleTimePeriodChange = (
      period: TimePeriod | null,
      range: TimePeriodDateRange,
   ) => {
      setTimePeriod(period);
      setDateRange({ endDate: range.endDate, startDate: range.startDate });
      if (range.selectedMonth) {
         setSelectedMonth(range.selectedMonth);
      }
   };

   const handleMonthChange = (month: Date) => {
      setSelectedMonth(month);
      setTimePeriod(null);
      setDateRange({
         endDate: endOfMonth(month),
         startDate: startOfMonth(month),
      });
   };

   const { data: bankAccount } = useSuspenseQuery(
      trpc.bankAccounts.getById.queryOptions({ id: bankAccountId }),
   );

   if (!bankAccountId) {
      return (
         <BankAccountPageError
            error={new Error("Invalid bank account ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!bankAccount) {
      return null;
   }

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/bank-accounts",
      });
   };

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
            title={bankAccount.name || "Conta Bancária"}
         />

         <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                     Importar extrato
                     <ChevronDown className="size-4" />
                  </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => setIsImportOfxOpen(true)}>
                     <FileSpreadsheet className="size-4" />
                     Importar OFX
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
            <Button
               onClick={() => setIsEditAccountOpen(true)}
               size="sm"
               variant="outline"
            >
               <Edit className="size-4" />
               Editar Conta
            </Button>
            <Button
               className="text-destructive hover:text-destructive"
               onClick={() => setIsDeleteAccountOpen(true)}
               size="sm"
               variant="outline"
            >
               <Trash2 className="size-4" />
               Excluir Conta
            </Button>
         </div>

         <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TimePeriodChips
               onValueChange={handleTimePeriodChange}
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

         <BankAccountStats
            bankAccountId={bankAccountId}
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
         />
         <BankAccountCharts
            bankAccountId={bankAccountId}
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
         />
         <RecentTransactions
            bankAccountId={bankAccountId}
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
         />

         <ManageTransactionSheet
            onOpen={isCreateTransactionOpen}
            onOpenChange={setIsCreateTransactionOpen}
         />
         <ManageBankAccountSheet
            bankAccount={bankAccount}
            onOpen={isEditAccountOpen}
            onOpenChange={setIsEditAccountOpen}
         />
         <DeleteBankAccount
            bankAccount={bankAccount}
            onSuccess={handleDeleteSuccess}
            open={isDeleteAccountOpen}
            setOpen={setIsDeleteAccountOpen}
         />
         <ImportOfxSheet
            bankAccountId={bankAccountId}
            isOpen={isImportOfxOpen}
            onOpenChange={setIsImportOfxOpen}
         />
      </main>
   );
}

function BankAccountPageSkeleton() {
   return (
      <main className="space-y-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-72" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
         </div>
         <Skeleton className="h-64 w-full" />
      </main>
   );
}

function BankAccountPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Building className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>Failed to load bank account</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/bank-accounts",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        Go to Bank Accounts
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        Try Again
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function BankAccountDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={BankAccountPageError}>
         <Suspense fallback={<BankAccountPageSkeleton />}>
            <BankAccountContent />
         </Suspense>
      </ErrorBoundary>
   );
}
