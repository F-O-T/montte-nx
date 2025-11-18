import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { FilePlus, Filter } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ManageBillSheet } from "../features/manage-bill-sheet";

type BillsQuickActionsToolbarProps = {
   type?: "payable" | "receivable";
};

export function BillsQuickActionsToolbar({
   type,
}: BillsQuickActionsToolbarProps) {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const navigate = useNavigate({ from: "/_dashboard/bills/" });
   const search = useSearch({ from: "/_dashboard/bills/" });

   const title =
      type === "payable"
         ? translate("dashboard.routes.bills.payables.actions.title")
         : type === "receivable"
           ? translate("dashboard.routes.bills.receivables.actions.title")
           : translate("dashboard.routes.bills.actions.title");

   const description =
      type === "payable"
         ? translate("dashboard.routes.bills.payables.description")
         : type === "receivable"
           ? translate("dashboard.routes.bills.receivables.description")
           : translate("dashboard.routes.bills.allBills.description");

   const handleTypeFilter = (newType?: "payable" | "receivable") => {
      if (newType) {
         navigate({
            search: { ...search, type: newType },
         });
      } else {
         const { type, ...rest } = search;
         navigate({
            search: Object.keys(rest).length > 0 ? rest : {},
         });
      }
   };

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle className="flex items-center gap-2">
                  {title}
                  {type && (
                     <Badge variant="secondary" className="text-xs">
                        {type === "payable"
                           ? translate("dashboard.routes.bills.types.payable")
                           : translate(
                                "dashboard.routes.bills.types.receivable",
                             )}
                     </Badge>
                  )}
               </ItemTitle>
               <ItemDescription>{description}</ItemDescription>
            </ItemContent>
            <div className="flex items-center gap-2 ml-auto">
               {/* Type filter buttons */}
               <div className="flex items-center gap-1 mr-2">
                  <Button
                     size="sm"
                     variant={!type ? "default" : "outline"}
                     onClick={() => handleTypeFilter()}
                  >
                     {translate("common.form.all")}
                  </Button>
                  <Button
                     size="sm"
                     variant={type === "payable" ? "default" : "outline"}
                     onClick={() => handleTypeFilter("payable")}
                  >
                     {translate("dashboard.routes.bills.types.payable")}
                  </Button>
                  <Button
                     size="sm"
                     variant={type === "receivable" ? "default" : "outline"}
                     onClick={() => handleTypeFilter("receivable")}
                  >
                     {translate("dashboard.routes.bills.types.receivable")}
                  </Button>
               </div>

               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        aria-label={translate("dashboard.routes.bills.addBill")}
                        onClick={() => setIsCreateSheetOpen(true)}
                        size="icon"
                        variant="outline"
                     >
                        <FilePlus className="h-4 w-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                     <p>{translate("dashboard.routes.bills.addBill")}</p>
                  </TooltipContent>
               </Tooltip>
            </div>
         </Item>

         <ManageBillSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </>
   );
}
