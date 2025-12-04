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
import { Edit, Home, Plus, Tag, Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { TransactionListProvider } from "@/features/transaction/lib/transaction-list-context";
import { ManageTransactionSheet } from "@/features/transaction/ui/manage-transaction-sheet";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { ManageTagSheet } from "../../tags/features/manage-tag-sheet";
import { DeleteTagDialog } from "../features/delete-tag-dialog";
import { TagCharts } from "./tag-charts";
import { TagStats } from "./tag-stats";
import { TagTransactions } from "./tag-transactions-section";

function TagContent() {
   const params = useParams({ strict: false });
   const tagId = (params as { tagId?: string }).tagId ?? "";
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const [isCreateTransactionOpen, setIsCreateTransactionOpen] =
      useState(false);
   const [isEditTagOpen, setIsEditTagOpen] = useState(false);
   const [isDeleteTagOpen, setIsDeleteTagOpen] = useState(false);

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

   const { data: tag } = useSuspenseQuery(
      trpc.tags.getById.queryOptions({ id: tagId }),
   );

   if (!tagId) {
      return (
         <TagPageError
            error={new Error("Invalid tag ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!tag) {
      return null;
   }

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/tags",
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
            description="Visualize detalhes e estatísticas da tag"
            title={tag.name}
         />

         <div className="flex flex-wrap items-center gap-2">
            <Button
               onClick={() => setIsEditTagOpen(true)}
               size="sm"
               variant="outline"
            >
               <Edit className="size-4" />
               Editar Tag
            </Button>
            <Button
               className="text-destructive hover:text-destructive"
               onClick={() => setIsDeleteTagOpen(true)}
               size="sm"
               variant="outline"
            >
               <Trash2 className="size-4" />
               Excluir Tag
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

         <TagStats
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
            tagId={tagId}
         />
         <TagCharts
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
            tagId={tagId}
         />
         <TagTransactions
            endDate={dateRange.endDate}
            startDate={dateRange.startDate}
            tagId={tagId}
         />

         <ManageTransactionSheet
            defaultTagIds={[tagId]}
            onOpen={isCreateTransactionOpen}
            onOpenChange={setIsCreateTransactionOpen}
         />
         <ManageTagSheet
            onOpen={isEditTagOpen}
            onOpenChange={setIsEditTagOpen}
            tag={tag}
         />
         <DeleteTagDialog
            onSuccess={handleDeleteSuccess}
            open={isDeleteTagOpen}
            setOpen={setIsDeleteTagOpen}
            tag={tag}
         />
      </main>
   );
}

function TagPageSkeleton() {
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

function TagPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Tag className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>Failed to load tag</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/tags",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        Go to Tags
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

export function TagDetailsPage() {
   return (
      <TransactionListProvider>
         <ErrorBoundary FallbackComponent={TagPageError}>
            <Suspense fallback={<TagPageSkeleton />}>
               <TagContent />
            </Suspense>
         </ErrorBoundary>
      </TransactionListProvider>
   );
}
