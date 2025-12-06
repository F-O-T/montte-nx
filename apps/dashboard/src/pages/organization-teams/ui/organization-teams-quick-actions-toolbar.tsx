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
import { Plus } from "lucide-react";
import { useSheet } from "@/hooks/use-sheet";
import { CreateTeamForm } from "../features/create-team-form";

export function TeamsQuickActionsToolbar() {
   const { openSheet } = useSheet();
   const quickActions = [
      {
         icon: <Plus className="size-4" />,
         label: "Create New Team",
         onClick: () => openSheet({ children: <CreateTeamForm /> }),
         variant: "default" as const,
      },
   ];

   return (
      <Item variant="outline">
         <ItemContent>
            <ItemTitle>Team Actions</ItemTitle>
            <ItemDescription>Manage organization teams</ItemDescription>
         </ItemContent>
         <ItemActions>
            <div className="flex flex-wrap gap-2">
               {quickActions.map((action, index) => (
                  <Tooltip key={`team-action-${index + 1}`}>
                     <TooltipTrigger asChild>
                        <Button
                           onClick={action.onClick}
                           size="icon"
                           variant={action.variant}
                        >
                           {action.icon}
                        </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                        <p>{action.label}</p>
                     </TooltipContent>
                  </Tooltip>
               ))}
            </div>
         </ItemActions>
      </Item>
   );
}
