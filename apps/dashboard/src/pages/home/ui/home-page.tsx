import { translate } from "@packages/localization";
import { DefaultHeader } from "@/default/default-header";

import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useRouter } from "@tanstack/react-router";
import { ArrowDownCircle, ArrowUpCircle, Repeat, Upload } from "lucide-react";
import { trpc } from "@/integrations/clients";
import { HomeChartsSection } from "./home-charts-section";
import { HomeQuickAccessCards } from "./home-quick-access-cards";
import { HomeRecentTransactionsSection } from "./home-recent-transactions-section";
import { HomeStatsSection } from "./home-stats-section";

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
      <main className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
         </div>

         <Skeleton className="h-20 w-full" />

         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
               <Skeleton className="h-32" key={i} />
            ))}
         </div>

         <section className="grid items-start gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
               <Skeleton className="h-[300px] w-full" />
               <div className="grid gap-4 md:grid-cols-2">
                  <Skeleton className="h-[260px]" />
                  <Skeleton className="h-[260px]" />
               </div>
            </div>
            <div className="space-y-4">
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-32 w-full" />
            </div>
         </section>
      </main>
   );
}

function getCurrentMonthDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
   return { end, start };
}

function HomeQuickNavigation() {
   const router = useRouter();

   const quickAccessItems = [
      {
         description: translate("dashboard.routes.transactions.description"),
         icon: <ArrowDownCircle className="size-5 text-red-500" />,
         onClick: () => router.navigate({ to: "/transactions" }),
         title: translate("dashboard.routes.transactions.title"),
      },
      {
         description: translate("dashboard.routes.transactions.description"),
         icon: <ArrowUpCircle className="size-5 text-emerald-500" />,
         onClick: () => router.navigate({ to: "/transactions" }),
         title: translate("dashboard.routes.transactions.title"),
      },
      {
         description: translate("dashboard.routes.transactions.description"),
         icon: <Repeat className="size-5 text-blue-500" />,
         onClick: () => router.navigate({ to: "/transactions" }),
         title: translate("dashboard.routes.transactions.title"),
      },
      {
         description: translate("dashboard.routes.bank-accounts.description"),
         icon: <Upload className="size-5 text-primary" />,
         onClick: () => router.navigate({ to: "/bank-accounts" }),
         title: translate("dashboard.routes.bank-accounts.title"),
      },
   ];

   return (
      <div className="grid gap-4 grid-cols-2">
         {quickAccessItems.map((item, index) => (
            <QuickAccessCard
               description={item.description}
               icon={item.icon}
               key={`home-quick-access-${index + 1}`}
               onClick={item.onClick}
               title={item.title}
            />
         ))}
      </div>
   );
}

function HomePageContent() {
   const { end: endDate, start: startDate } = getCurrentMonthDates();

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

   const { data: performance } = useSuspenseQuery(
      trpc.reports.getPaymentPerformance.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   return (
      <main className="flex flex-col gap-6">
         <DefaultHeader
            description={translate("dashboard.routes.home.description")}
            title={translate("dashboard.routes.home.title")}
         />

         <section className="grid items-start gap-4 xl:grid-cols-3">
            <div className="grid h-full col-span-2 gap-4">
               <HomeRecentTransactionsSection />
            </div>
            <div className="flex flex-col gap-4">
               <HomeQuickAccessCards summary={summary} />
               <HomeQuickNavigation />
            </div>
            <div className="space-y-4 xl:col-span-3">
               <HomeStatsSection performance={performance} summary={summary} />
               <HomeChartsSection
                  cashFlow={cashFlow}
                  plannedVsActual={plannedVsActual}
               />
            </div>
         </section>

         <section className="grid items-start gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2"></div>
         </section>
      </main>
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
