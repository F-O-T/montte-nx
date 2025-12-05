import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { MonthSelector } from "@packages/ui/components/month-selector";
import { TimePeriodChips } from "@packages/ui/components/time-period-chips";
import { useSearch } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { DefaultHeader } from "@/default/default-header";
import { useSheet } from "@/hooks/use-sheet";
import { BillListProvider, useBillList } from "../features/bill-list-context";
import { ManageBillForm } from "../features/manage-bill-sheet";
import { BillsListSection } from "./bills-list-section";
import { BillsStats } from "./bills-stats";

type BillsSearch = {
   type?: "payable" | "receivable";
};

function BillsPageContent() {
   const { openSheet } = useSheet();
   const search = useSearch({
      from: "/$slug/_dashboard/bills/",
   }) as BillsSearch;
   const billType = search.type;

   const {
      timePeriod,
      handleTimePeriodChange,
      selectedMonth,
      handleMonthChange,
   } = useBillList();

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

         <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <TimePeriodChips
               onValueChange={(period) => handleTimePeriodChange(period)}
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
