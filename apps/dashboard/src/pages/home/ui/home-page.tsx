import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";
import { HomeChartsSection } from "./home-charts-section";
import { HomeFilterSheet } from "./home-filter-sheet";
import { HomeQuickAccessCards } from "./home-quick-access-cards";
import { HomeQuickActionsToolbar } from "./home-quick-actions-toolbar";

function HomePageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription:
         "Failed to load financial overview. Please try again later.",
      errorTitle: "Error loading overview",
      retryText: "Retry",
   })(props);
}

function HomePageSkeleton() {
   return (
      <main className="grid md:grid-cols-3 gap-4">
         <div className="h-min col-span-1 md:col-span-2 grid gap-4">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-2 gap-4">
               {[1, 2].map((i) => (
                  <Skeleton className="h-32" key={i} />
               ))}
            </div>
         </div>
         <div className="grid gap-4">
            <Skeleton className="h-[400px]" />
            <div className="grid gap-4 md:grid-cols-2">
               <Skeleton className="h-[400px]" />
               <Skeleton className="h-[400px]" />
            </div>
         </div>
      </main>
   );
}

function getCurrentMonthDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
   return { end, start };
}

function HomePageContent() {
   const initialDates = getCurrentMonthDates();
   const [startDate, setStartDate] = useState<Date>(initialDates.start);
   const [endDate, setEndDate] = useState<Date>(initialDates.end);
   const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

   const handlePeriodChange = (start: Date, end: Date) => {
      setStartDate(start);
      setEndDate(end);
   };

   const handleFilterClick = () => {
      setIsFilterSheetOpen(true);
   };

   const { data: summary } = useSuspenseQuery(
      trpc.reports.getFinancialSummary.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   const { data: cashFlow } = useSuspenseQuery(
      trpc.reports.getCashFlow.queryOptions({
         endDate: endDate.toISOString(),
         groupBy: "day",
         startDate: startDate.toISOString(),
      }),
   );

   const { data: plannedVsActual } = useSuspenseQuery(
      trpc.reports.getPlannedVsActual.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   return (
      <>
         <main className="grid md:grid-cols-3 gap-4">
            <div className="h-min col-span-1 md:col-span-3 grid gap-4">
               <HomeQuickActionsToolbar onFilterClick={handleFilterClick} />
               <HomeQuickAccessCards summary={summary} />
               <HomeChartsSection
                  cashFlow={cashFlow}
                  plannedVsActual={plannedVsActual}
               />
            </div>
         </main>
         <HomeFilterSheet
            isOpen={isFilterSheetOpen}
            onOpenChange={setIsFilterSheetOpen}
            onPeriodChange={handlePeriodChange}
         />
      </>
   );
}

export function HomePage() {
   return (
      <ErrorBoundary FallbackComponent={HomePageErrorFallback}>
         <Suspense fallback={<HomePageSkeleton />}>
            <HomePageContent />
         </Suspense>
      </ErrorBoundary>
   );
}
