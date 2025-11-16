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
import { useState } from "react";
import { ManageCategorySheet } from "../features/manage-category-sheet";

export function CategoriesQuickActionsToolbar() {
   const [open, setOpen] = useState(false);

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle>Categories Actions</ItemTitle>
               <ItemDescription>
                  Manage your transaction categories
               </ItemDescription>
            </ItemContent>
            <div className="ml-auto">
               <Tooltip>
                  <TooltipTrigger asChild>
                     <Button
                        aria-label="Add new category"
                        onClick={() => setOpen(true)}
                        size="icon"
                        variant="outline"
                     >
                        <FilePlus className="h-4 w-4" />
                     </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                     <p>Add Category</p>
                  </TooltipContent>
               </Tooltip>
            </div>
         </Item>
         <ManageCategorySheet onOpen={open} onOpenChange={setOpen} />
      </>
   );
}
