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
import { FilePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { ManageBillSheet } from "../features/manage-bill-sheet";
import { useBillList } from "../features/bill-list-context";

type BillsQuickActionsToolbarProps = {
   type?: "payable" | "receivable";
};

export function BillsQuickActionsToolbar({
   type,
}: BillsQuickActionsToolbarProps) {
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const { setCurrentFilterType } = useBillList();

   // Set the context filter type based on the component prop
   useEffect(() => {
      setCurrentFilterType(type);
   }, [type, setCurrentFilterType]);

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle className="flex items-center gap-2">
                  {translate("common.headers.actions-toolbar.title")}
                  {type && (
                     <Badge variant="secondary">
                        {type === "payable"
                           ? translate("dashboard.routes.bills.payables.title")
                           : translate(
                                "dashboard.routes.bills.receivables.title",
                             )}
                     </Badge>
                  )}
               </ItemTitle>
               <ItemDescription>
                  {translate("common.headers.actions-toolbar.description")}
               </ItemDescription>
            </ItemContent>
            <div className="flex items-center gap-2 ml-auto">
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
