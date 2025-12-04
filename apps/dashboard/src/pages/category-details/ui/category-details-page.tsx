import { translate } from "@packages/localization";
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { endOfMonth, startOfMonth } from "date-fns";
import { Edit, FileText, Home, Plus, Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { TransactionListProvider } from "@/features/transaction/lib/transaction-list-context";
import { ManageTransactionSheet } from "@/features/transaction/ui/manage-transaction-sheet";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { ManageCategorySheet } from "../../categories/features/manage-category-sheet";
import { DeleteCategoryDialog } from "../features/delete-category-dialog";
import { CategoryCharts } from "./category-charts";
import { CategoryStats } from "./category-stats";
import { CategoryTransactions } from "./category-transactions-section";

function CategoryContent() {
   const params = useParams({ strict: false });
   const categoryId = (params as { categoryId?: string }).categoryId ?? "";
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const [isCreateTransactionOpen, setIsCreateTransactionOpen] =
      useState(false);
   const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
   const [isDeleteCategoryOpen, setIsDeleteCategoryOpen] = useState(false);

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

   const { data: category } = useSuspenseQuery(
      trpc.categories.getById.queryOptions({ id: categoryId }),
   );

   if (!categoryId) {
      return (
         <CategoryPageError
            error={new Error("Invalid category ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!category) {
      return null;
   }

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/categories",
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
               "dashboard.routes.categories.details-section.description",
            )}
            title={category.name}
         />

         <div className="flex flex-wrap items-center gap-2">
            <Button
               onClick={() => setIsEditCategoryOpen(true)}
               size="sm"
               variant="outline"
            >
               <Edit className="size-4" />
               Editar Categoria
            </Button>
            <Button
               className="text-destructive hover:text-destructive"
               onClick={() => setIsDeleteCategoryOpen(true)}
               size="sm"
               variant="outline"
            >
               <Trash2 className="size-4" />
               Excluir Categoria
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

         <CategoryStats
            categoryId={categoryId}
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
         />
         <CategoryCharts
            categoryId={categoryId}
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
         />
         <CategoryTransactions
            categoryId={categoryId}
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
         />

         <ManageTransactionSheet
            defaultCategoryIds={[categoryId]}
            onOpen={isCreateTransactionOpen}
            onOpenChange={setIsCreateTransactionOpen}
         />
         <ManageCategorySheet
            category={category}
            onOpen={isEditCategoryOpen}
            onOpenChange={setIsEditCategoryOpen}
         />
         <DeleteCategoryDialog
            category={category}
            onSuccess={handleDeleteSuccess}
            open={isDeleteCategoryOpen}
            setOpen={setIsDeleteCategoryOpen}
         />
      </main>
   );
}

function CategoryPageSkeleton() {
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

function CategoryPageError({ error, resetErrorBoundary }: FallbackProps) {
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
                  <EmptyTitle>Failed to load category</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/categories",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        Go to Categories
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

export function CategoryDetailsPage() {
   return (
      <TransactionListProvider>
         <ErrorBoundary FallbackComponent={CategoryPageError}>
            <Suspense fallback={<CategoryPageSkeleton />}>
               <CategoryContent />
            </Suspense>
         </ErrorBoundary>
      </TransactionListProvider>
   );
}
