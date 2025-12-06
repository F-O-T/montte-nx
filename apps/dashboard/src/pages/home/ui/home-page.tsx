import { translate } from "@packages/localization";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { HomeBalanceCard } from "./home-balance-card";
import { HomeBankAccountsSection } from "./home-bank-accounts-section";
import { HomeQuickActions } from "./home-quick-actions";
import { HomeRecentTransactionsSection } from "./home-recent-transactions-section";

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

         <Skeleton className="h-40 w-full" />

         <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
               <Skeleton className="h-32" key={i} />
            ))}
         </div>

         <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
               <Skeleton className="h-20" key={i} />
            ))}
         </div>

         <Skeleton className="h-[300px] w-full" />
      </main>
   );
}

function HomePageContent() {
   return (
      <main className="flex flex-col gap-6">
         <DefaultHeader
            description={translate("dashboard.routes.home.description")}
            title={translate("dashboard.routes.home.title")}
         />

         <HomeBalanceCard />

         <HomeQuickActions />

         <HomeBankAccountsSection />

         <HomeRecentTransactionsSection />
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
