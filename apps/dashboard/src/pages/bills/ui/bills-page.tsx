import { BillsQuickActionsToolbar } from "./bills-quick-actions-toolbar";
import { BillsListSection } from "./bills-list-section";
import { BillsStats } from "./bills-stats";
import { useSearch } from "@tanstack/react-router";

type BillsSearch = {
   type?: "payable" | "receivable";
};

export function BillsPage() {
   const search = useSearch({ from: "/_dashboard/bills/" }) as BillsSearch;
   const billType = search.type;

   return (
      <main className="grid md:grid-cols-3 gap-4">
         <div className="h-min col-span-1 md:col-span-2 grid gap-4">
            <BillsQuickActionsToolbar type={billType} />
            <BillsListSection type={billType} />
         </div>
         <BillsStats type={billType} />
      </main>
   );
}

