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
import { MailPlus } from "lucide-react";
import { SendInvitationForm } from "@/features/organization-actions/ui/send-invitation-form";
import { useSheet } from "@/hooks/use-sheet";

export function InvitesQuickActionsToolbar() {
   const { openSheet } = useSheet();

   const quickActions = [
      {
         icon: <MailPlus className="size-4" />,
         label: "Send New Invitation",
         onClick: () =>
            openSheet({
               children: <SendInvitationForm />,
            }),
         variant: "default" as const,
      },
   ];

   return (
      <Item variant="outline">
         <ItemContent>
            <ItemTitle>Invitation Actions</ItemTitle>
            <ItemDescription>Manage organization invitations</ItemDescription>
         </ItemContent>
         <ItemActions>
            <div className="flex flex-wrap gap-2">
               {quickActions.map((action, index) => (
                  <Tooltip key={`invite-action-${index + 1}`}>
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
