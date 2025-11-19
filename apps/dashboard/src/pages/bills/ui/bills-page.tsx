import { useSearch } from "@tanstack/react-router";
import { BillListProvider } from "../features/bill-list-context";
import { BillsListSection } from "./bills-list-section";
import { BillsQuickActionsToolbar } from "./bills-quick-actions-toolbar";
import { BillsStats } from "./bills-stats";

type BillsSearch = {
   type?: "payable" | "receivable";
};

export function BillsPage() {
   const search = useSearch({ from: "/_dashboard/bills/" }) as BillsSearch;
   const billType = search.type;

   return (
      <BillListProvider>
         <main className="grid md:grid-cols-3 gap-4">
            <div className="h-min col-span-1 md:col-span-2 grid gap-4">
               <BillsQuickActionsToolbar type={billType} />
               <BillsListSection type={billType} />
            </div>
            <BillsStats type={billType} />
         </main>
      </BillListProvider>
   );
}
