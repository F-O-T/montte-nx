import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Item,
   ItemActions,
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
import { useEffect, useMemo, useState } from "react";
import { useBillList } from "../features/bill-list-context";
import { ManageBillSheet } from "../features/manage-bill-sheet";

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
   const badgeText = useMemo(() => {
      if (type === "payable") {
         return translate("dashboard.routes.bills.views.payables.title");
      }
      return translate("dashboard.routes.bills.views.receivables.title");
   }, [type]);
   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle className="flex items-center gap-2">
                  {translate("common.headers.actions-toolbar.title")}
                  {type && <Badge variant="secondary">{badgeText}</Badge>}
               </ItemTitle>
               <ItemDescription>
                  {translate("common.headers.actions-toolbar.description")}
               </ItemDescription>
            </ItemContent>
            <ItemActions>
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        aria-label={translate(
                           "dashboard.routes.bills.actions-toolbar.actions.add-new",
                        )}
                        onClick={() => setIsCreateSheetOpen(true)}
                        size="icon"
                        variant="outline"
                     >
                        <FilePlus className="h-4 w-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                     <p>
                        {translate(
                           "dashboard.routes.bills.actions-toolbar.actions.add-new",
                        )}
                     </p>
                  </TooltipContent>
               </Tooltip>
            </ItemActions>
         </Item>

         <ManageBillSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </>
   );
}
