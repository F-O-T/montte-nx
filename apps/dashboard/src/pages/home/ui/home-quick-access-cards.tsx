import { translate } from "@packages/localization";
import { formatDecimalCurrency } from "@packages/utils/money";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
   ArrowDownRight,
   ArrowUpRight,
   BarChart3,
   TrendingUp,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { trpc } from "@/integrations/clients";

function HomeQuickAccessCardsErrorFallback(props: FallbackProps) {
   return (
      <div className="grid gap-4">
         {createErrorFallback({
            errorDescription:
               "Failed to load quick access information. Please try again later.",
            errorTitle: "Error loading quick access",
            retryText: translate("common.actions.retry"),
         })(props)}
      </div>
   );
}

function HomeQuickAccessCardsSkeleton() {
   return (
      <div className="grid grid-cols-2 gap-4">
         {[1, 2, 3, 4].map((index) => (
            <Skeleton
               className="h-24 w-full"
               key={`home-quick-access-skeleton-${index + 1}`}
            />
         ))}
      </div>
   );
}

function getCurrentMonthDates() {
   const now = new Date();
   const start = new Date(now.getFullYear(), now.getMonth(), 1);
   const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
   return { end, start };
}

function HomeQuickAccessCardsContent() {
   const router = useRouter();
   const { end: endDate, start: startDate } = getCurrentMonthDates();

   const { data: summary } = useSuspenseQuery(
      trpc.reports.getFinancialSummary.queryOptions({
         endDate: endDate.toISOString(),
         startDate: startDate.toISOString(),
      }),
   );

   const quickAccessItems = [
      {
         description: translate(
            "dashboard.routes.transactions.list-section.description",
         ),
         icon: <TrendingUp className="size-4" />,
         onClick: () => router.navigate({ to: "/transactions" }),
         title: translate("dashboard.layout.nav-main.finance.overview"),
      },
      {
         description: translate(
            "dashboard.routes.bills.views.payables.description",
         ),
         icon: <ArrowDownRight className="size-4" />,
         onClick: () =>
            router.navigate({
               params: {
                  type: "payable",
               },
               to: "/bills",
            }),
         title: translate("dashboard.layout.nav-main.finance.payables"),
      },
      {
         description: translate(
            "dashboard.routes.bills.views.receivables.description",
         ),
         icon: <ArrowUpRight className="size-4" />,
         onClick: () =>
            router.navigate({ params: { type: "receivable" }, to: "/bills" }),
         title: translate("dashboard.layout.nav-main.finance.receivables"),
      },
      {
         description: translate("dashboard.routes.reports.description"),
         icon: <BarChart3 className="size-4" />,
         onClick: () => router.navigate({ to: "/reports" }),
         title: translate("dashboard.layout.nav-main.finance.reports"),
      },
   ];

   return (
      <div className="grid gap-4">
         <div className="grid md:grid-cols-2 gap-4">
            <StatsCard
               description={translate(
                  "dashboard.routes.home.financial-summary.total-income.description",
               )}
               title={translate(
                  "dashboard.routes.home.financial-summary.total-income.title",
               )}
               value={formatDecimalCurrency(summary.totalIncome)}
            />
            <StatsCard
               description={translate(
                  "dashboard.routes.home.financial-summary.total-expenses.description",
               )}
               title={translate(
                  "dashboard.routes.home.financial-summary.total-expenses.title",
               )}
               value={formatDecimalCurrency(summary.totalExpenses)}
            />
         </div>

         <div className="grid md:grid-cols-2 gap-4">
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
      </div>
   );
}

export function HomeQuickAccessCards() {
   return (
      <ErrorBoundary FallbackComponent={HomeQuickAccessCardsErrorFallback}>
         <Suspense fallback={<HomeQuickAccessCardsSkeleton />}>
            <HomeQuickAccessCardsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
