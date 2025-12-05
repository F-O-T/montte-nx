import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
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
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { endOfMonth, startOfMonth } from "date-fns";
import {
   CircleDot,
   Edit,
   FileText,
   HelpCircle,
   Home,
   Plus,
   RefreshCw,
   Trash2,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { TransactionListProvider } from "@/features/transaction/lib/transaction-list-context";
import { ManageTransactionSheet } from "@/features/transaction/ui/manage-transaction-sheet";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { ManageBudgetForm } from "@/pages/budgets/features/manage-budget-form";
import { useDeleteBudget } from "@/pages/budgets/features/use-delete-budget";
import { useToggleBudgetStatus } from "@/pages/budgets/features/use-toggle-budget-status";
import { useToggleRollover } from "@/pages/budgets/features/use-toggle-rollover";
import { BudgetDetailsStats } from "./budget-details-stats";
import { BudgetInformationSection } from "./budget-information-section";
import { BudgetProgressSection } from "./budget-progress-section";
import { BudgetTransactionsSection } from "./budget-transactions-section";

function BudgetContent() {
   const params = useParams({ strict: false });
   const budgetId = (params as { budgetId?: string }).budgetId ?? "";
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();

   const [isCreateTransactionOpen, setIsCreateTransactionOpen] =
      useState(false);

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

   const { data: budget } = useSuspenseQuery(
      trpc.budgets.getById.queryOptions({ id: budgetId }),
   );

   const budgetForList = {
      ...budget,
      periods: budget?.currentPeriod ? [budget.currentPeriod] : [],
   };

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/budgets",
      });
   };

   const { deleteBudget } = useDeleteBudget({
      budget: budgetForList,
      onSuccess: handleDeleteSuccess,
   });
   const { isUpdating: isStatusUpdating, toggleStatus } = useToggleBudgetStatus(
      { budget: budgetForList },
   );
   const { isUpdating: isRolloverUpdating, toggleRollover } = useToggleRollover(
      { budget },
   );

   if (!budgetId) {
      return (
         <BudgetPageError
            error={new Error("Invalid budget ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!budget) {
      return null;
   }

   const regimeLabels: Record<string, string> = {
      accrual: translate("dashboard.routes.budgets.form.regime.accrual"),
      cash: translate("dashboard.routes.budgets.form.regime.cash"),
   };

   const target = budget.target as
      | { type: "category"; categoryId: string }
      | { type: "categories"; categoryIds: string[] }
      | { type: "tag"; tagId: string }
      | { type: "cost_center"; costCenterId: string };

   const defaultCategoryIds =
      target.type === "category"
         ? [target.categoryId]
         : target.type === "categories"
           ? target.categoryIds
           : [];

   const defaultTagIds = target.type === "tag" ? [target.tagId] : [];

   const defaultCostCenterId =
      target.type === "cost_center" ? target.costCenterId : "";

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
               "dashboard.routes.budgets.details.page.description",
            )}
            title={budget.name}
         />

         <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap items-center gap-2">
               <Button
                  onClick={() =>
                     openSheet({
                        children: <ManageBudgetForm budget={budgetForList} />,
                     })
                  }
                  size="sm"
                  variant="outline"
               >
                  <Edit className="size-4" />
                  {translate("dashboard.routes.budgets.details.actions.edit")}
               </Button>
               <Button
                  className="text-destructive hover:text-destructive"
                  onClick={deleteBudget}
                  size="sm"
                  variant="outline"
               >
                  <Trash2 className="size-4" />
                  {translate("dashboard.routes.budgets.details.actions.delete")}
               </Button>
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div className="flex flex-wrap items-center gap-2">
               <Button
                  className="gap-2"
                  disabled={isStatusUpdating}
                  onClick={toggleStatus}
                  size="sm"
                  variant="outline"
               >
                  <CircleDot className="size-4" />
                  {translate(
                     "dashboard.routes.budgets.details.information.status",
                  )}
                  <Badge variant={budget.isActive ? "default" : "secondary"}>
                     {budget.isActive
                        ? translate("dashboard.routes.budgets.status.active")
                        : translate("dashboard.routes.budgets.status.inactive")}
                  </Badge>
               </Button>

               <Button
                  className="gap-2"
                  disabled={isRolloverUpdating}
                  onClick={toggleRollover}
                  size="sm"
                  variant="outline"
               >
                  <RefreshCw className="size-4" />
                  {translate(
                     "dashboard.routes.budgets.details.information.rollover",
                  )}
                  <Badge variant={budget.rollover ? "default" : "secondary"}>
                     {budget.rollover
                        ? translate(
                             "dashboard.routes.budgets.details.information.rollover-enabled",
                          )
                        : translate(
                             "dashboard.routes.budgets.details.information.rollover-disabled",
                          )}
                  </Badge>
               </Button>

               <Tooltip>
                  <TooltipTrigger asChild>
                     <Badge className="cursor-help gap-1" variant="outline">
                        {regimeLabels[budget.regime] ?? budget.regime}
                        <HelpCircle className="size-3" />
                     </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                     {budget.regime === "cash"
                        ? translate(
                             "dashboard.routes.budgets.regime-tooltip.cash",
                          )
                        : translate(
                             "dashboard.routes.budgets.regime-tooltip.accrual",
                          )}
                  </TooltipContent>
               </Tooltip>
            </div>
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

         <BudgetProgressSection budget={budget} />
         <BudgetDetailsStats budget={budget} />
         <BudgetTransactionsSection
            budget={budget}
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
         />
         <BudgetInformationSection budget={budget} />

         <ManageTransactionSheet
            defaultCategoryIds={defaultCategoryIds}
            defaultCostCenterId={defaultCostCenterId}
            defaultTagIds={defaultTagIds}
            onOpen={isCreateTransactionOpen}
            onOpenChange={setIsCreateTransactionOpen}
         />
      </main>
   );
}

function BudgetPageSkeleton() {
   return (
      <main className="space-y-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-72" />
         </div>
         <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
         </div>
         <div className="flex gap-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
         </div>
         <Skeleton className="h-32 w-full" />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
         </div>
         <Skeleton className="h-64 w-full" />
         <Skeleton className="h-64 w-full" />
      </main>
   );
}

function BudgetPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <FileText className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate("dashboard.routes.budgets.details.error.title")}
                  </EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/budgets",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        {translate(
                           "dashboard.routes.budgets.details.error.back",
                        )}
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        {translate("common.actions.retry")}
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function BudgetDetailsPage() {
   return (
      <TransactionListProvider>
         <ErrorBoundary FallbackComponent={BudgetPageError}>
            <Suspense fallback={<BudgetPageSkeleton />}>
               <BudgetContent />
            </Suspense>
         </ErrorBoundary>
      </TransactionListProvider>
   );
}
