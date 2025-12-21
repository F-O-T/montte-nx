import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQueries } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { DefaultHeader } from "@/default/default-header";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { BillListProvider, useBillList } from "../features/bill-list-context";
import { ManageBillForm } from "../features/manage-bill-form";
import { BillFilterBar } from "./bill-filter-bar";
import { BillsListSection } from "./bills-list-section";
import { BillsStats } from "./bills-stats";

type BillsSearch = {
   type?: "payable" | "receivable";
};

function BillFilterBarSkeleton() {
   return (
      <div className="space-y-3">
         <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
               {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                     className="h-8 w-20"
                     key={`period-skeleton-${i + 1}`}
                  />
               ))}
            </div>
            <Skeleton className="h-8 w-32" />
         </div>
         <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
               <Skeleton className="h-8 w-24" />
               <Skeleton className="h-8 w-24" />
               <Skeleton className="h-8 w-24" />
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex gap-1">
               <Skeleton className="h-8 w-20" />
               <Skeleton className="h-8 w-24" />
            </div>
            <div className="h-4 w-px bg-border" />
            <Skeleton className="h-8 w-28" />
         </div>
      </div>
   );
}

function BillFilterBarWrapper() {
   const trpc = useTRPC();
   const search = useSearch({
      from: "/$slug/_dashboard/bills/",
   }) as BillsSearch;
   const billType = search.type;

   const {
      timePeriod,
      handleTimePeriodChange,
      customDateRange,
      setCustomDateRange,
      statusFilter,
      setStatusFilter,
      typeFilter,
      setTypeFilter,
      categoryFilter,
      setCategoryFilter,
      bankAccountFilter,
      setBankAccountFilter,
      clearFilters,
      hasActiveFilters,
      pageSize,
      setPageSize,
      setCurrentFilterType,
   } = useBillList();

   // Set current filter type based on route
   if (billType === "payable") {
      setCurrentFilterType("payable");
   } else if (billType === "receivable") {
      setCurrentFilterType("receivable");
   } else {
      setCurrentFilterType(undefined);
   }

   const [categoriesQuery, bankAccountsQuery] = useSuspenseQueries({
      queries: [
         trpc.categories.getAll.queryOptions(),
         trpc.bankAccounts.getAll.queryOptions(),
      ],
   });

   return (
      <BillFilterBar
         bankAccountFilter={bankAccountFilter}
         bankAccounts={bankAccountsQuery.data ?? []}
         categories={categoriesQuery.data ?? []}
         categoryFilter={categoryFilter}
         currentFilterType={billType}
         customDateRange={customDateRange}
         hasActiveFilters={hasActiveFilters}
         onBankAccountFilterChange={setBankAccountFilter}
         onCategoryFilterChange={setCategoryFilter}
         onClearFilters={clearFilters}
         onCustomDateRangeChange={setCustomDateRange}
         onPageSizeChange={setPageSize}
         onStatusFilterChange={setStatusFilter}
         onTimePeriodChange={handleTimePeriodChange}
         onTypeFilterChange={setTypeFilter}
         pageSize={pageSize}
         statusFilter={statusFilter}
         timePeriod={timePeriod}
         typeFilter={typeFilter}
      />
   );
}

function BillsPageContent() {
   const { openSheet } = useSheet();
   const search = useSearch({
      from: "/$slug/_dashboard/bills/",
   }) as BillsSearch;
   const billType = search.type;

   const getHeaderContent = () => {
      if (billType === "payable") {
         return {
            description: translate(
               "dashboard.routes.bills.views.payables.description",
            ),
            title: translate("dashboard.routes.bills.views.payables.title"),
         };
      }
      if (billType === "receivable") {
         return {
            description: translate(
               "dashboard.routes.bills.views.receivables.description",
            ),
            title: translate("dashboard.routes.bills.views.receivables.title"),
         };
      }
      return {
         description: translate(
            "dashboard.routes.bills.views.allBills.description",
         ),
         title: translate("dashboard.routes.bills.views.allBills.title"),
      };
   };

   const { title, description } = getHeaderContent();

   return (
      <main className="space-y-4">
         <DefaultHeader
            actions={
               <Button
                  onClick={() =>
                     openSheet({
                        children: <ManageBillForm />,
                     })
                  }
               >
                  <Plus className="size-4" />
                  {translate(
                     "dashboard.routes.bills.list-section.actions.add-new",
                  )}
               </Button>
            }
            description={description}
            title={title}
         />

         <Suspense fallback={<BillFilterBarSkeleton />}>
            <BillFilterBarWrapper />
         </Suspense>

         <BillsStats type={billType} />
         <BillsListSection type={billType} />
      </main>
   );
}

export function BillsPage() {
   return (
      <BillListProvider>
         <BillsPageContent />
      </BillListProvider>
   );
}
