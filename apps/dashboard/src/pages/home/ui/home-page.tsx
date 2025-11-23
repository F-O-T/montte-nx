import { translate } from "@packages/localization";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { HomeBankAccountsSection } from "./home-bank-accounts-section";
import { HomeChartsSection } from "./home-charts-section";
import { HomeQuickAccessCards } from "./home-quick-access-cards";
import { HomeRecentTransactionsSection } from "./home-recent-transactions-section";
import { HomeStatsSection } from "./home-stats-section";

function HomePageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription:
         "Failed to load financial overview. Please try again later.",
      errorTitle: "Error loading overview",
      retryText: translate("common.actions.retry"),
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
            <div className="space-y-4 xl:col-span-3">
               <Skeleton className="h-[120px] w-full" />
            </div>
            <div className="grid h-full col-span-2 gap-4">
               <Skeleton className="h-[260px]" />
            </div>

            <div className="space-y-4">
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4 xl:col-span-3">
               <Skeleton className="h-[260px] w-full" />
               <Skeleton className="h-[260px] w-full" />
            </div>
         </section>
      </main>
   );
}

function HomePageContent() {
   return (
      <main className="flex flex-col gap-4">
         <DefaultHeader
            description={translate("dashboard.routes.home.description")}
            title={translate("dashboard.routes.home.title")}
         />

         <section className="grid grid-cols-1  gap-4 md:grid-cols-3">
            <div className="col-span-1 md:col-span-3">
               <HomeBankAccountsSection />
            </div>
            <div className=" h-full md:col-span-2 gap-4">
               <HomeRecentTransactionsSection />
            </div>

            <div className="col-span-1">
               <HomeQuickAccessCards />
            </div>
            <div className="col-span-1 md:col-span-3 space-y-4">
               <HomeStatsSection />
               <HomeChartsSection />
            </div>
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
