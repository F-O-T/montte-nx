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
import { useSuspenseQuery } from "@tanstack/react-query";
import { Edit, Trash2, UserPlus } from "lucide-react";
import { ManageOrganizationForm } from "@/features/organization-actions/ui/manage-organization-form";
import { SendInvitationForm } from "@/features/organization-actions/ui/send-invitation-form";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { useDeleteOrganization } from "../features/use-delete-organization";
export function QuickActionsToolbar() {
   const trpc = useTRPC();
   const { data: activeOrganization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );
   const { deleteOrganization } = useDeleteOrganization({
      organization: activeOrganization,
   });
   const { openSheet } = useSheet();
   const quickActions = [
      {
         icon: <Edit className="size-4" />,
         label: translate(
            "dashboard.routes.organization.toolbar-section.actions.edit-organization",
         ),
         onClick: () =>
            openSheet({
               children: (
                  <ManageOrganizationForm organization={activeOrganization} />
               ),
            }),
         variant: "outline" as const,
      },
      {
         icon: <UserPlus className="size-4" />,
         label: translate(
            "dashboard.routes.organization.toolbar-section.actions.invite-new-member",
         ),
         onClick: () =>
            openSheet({
               children: <SendInvitationForm />,
            }),
         variant: "outline" as const,
      },
      {
         icon: <Trash2 className="size-4" />,
         label: translate(
            "dashboard.routes.organization.toolbar-section.actions.delete-organization",
         ),
         onClick: deleteOrganization,
         variant: "destructive" as const,
      },
   ];

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
            <div className="flex flex-wrap gap-2">
               {quickActions.map((action, index) => (
                  <Tooltip key={`quick-action-${index + 1}`}>
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
