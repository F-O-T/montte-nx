import { translate } from "@packages/localization";
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
import { useState } from "react";
import { ManageCategorySheet } from "../features/manage-category-sheet";

export function CategoriesQuickActionsToolbar() {
   const [open, setOpen] = useState(false);

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle>
                  {translate("common.headers.actions-toolbar.title")}
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
                           "dashboard.routes.categories.actions-toolbar.actions.add-new",
                        )}
                        onClick={() => setOpen(true)}
                        size="icon"
                        variant="outline"
                     >
                        <FilePlus className="h-4 w-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                     <p>
                        {translate(
                           "dashboard.routes.categories.actions-toolbar.actions.add-new",
                        )}
                     </p>
                  </TooltipContent>
               </Tooltip>
            </ItemActions>
         </Item>
         <ManageCategorySheet onOpen={open} onOpenChange={setOpen} />
      </>
   );
}
