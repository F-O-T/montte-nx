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
import { Filter } from "lucide-react";

interface HomeQuickActionsToolbarProps {
   onFilterClick: () => void;
}

export function HomeQuickActionsToolbar({
   onFilterClick,
}: HomeQuickActionsToolbarProps) {
   return (
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
                     aria-label="Filter data"
                     onClick={onFilterClick}
                     size="icon"
                     variant="outline"
                  >
                     <Filter className="size-4" />
                  </Button>
               </TooltipTrigger>
               <TooltipContent>
                  <p>Filter by date range</p>
               </TooltipContent>
            </Tooltip>
         </ItemActions>
      </Item>
   );
}
