import { useSearch } from "@tanstack/react-router";
import { DefaultHeader } from "@/default/default-header";
import { BillListProvider } from "../features/bill-list-context";
import { BillsListSection } from "./bills-list-section";
import { BillsStats } from "./bills-stats";

type BillsSearch = {
   type?: "payable" | "receivable";
};

export function BillsPage() {
   const search = useSearch({ from: "/_dashboard/bills/" }) as BillsSearch;
   const billType = search.type;

   const getHeaderContent = () => {
      if (billType === "payable") {
         return {
            description: "Gerencie suas despesas futuras",
            title: "Contas a Pagar",
         };
      }
      if (billType === "receivable") {
         return {
            description: "Gerencie suas receitas futuras",
            title: "Contas a Receber",
         };
      }
      return {
         description: "Gerencie suas contas a pagar e receber",
         title: "Contas a Pagar e Receber",
      };
   };

   const { title, description } = getHeaderContent();

   return (
      <BillListProvider>
         <main className="grid gap-4">
            <DefaultHeader description={description} title={title} />
            <div className="grid md:grid-cols-3 gap-4">
               <div className="h-min col-span-1 md:col-span-2 grid gap-4">
                  <BillsListSection type={billType} />
               </div>
               <BillsStats type={billType} />
            </div>
         </main>
      </BillListProvider>
   );
}
