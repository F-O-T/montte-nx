import { SendInvitationSheet } from "@/features/organization-actions/ui/send-invitation-sheet";
import { useTRPC } from "@/integrations/clients";
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
import { Edit, Plus, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { DeleteOrganizationDialog } from "../features/delete-organization-dialog";
import { EditOrganizationSheet } from "../features/edit-organization-sheet";

export function QuickActionsToolbar() {
   const trpc = useTRPC();
   const { data: activeOrganization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );
   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );
   const { data: organizationLimit } = useSuspenseQuery(
      trpc.organization.getOrganizationLimit.queryOptions(),
   );
   const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
   const [isInvitationSheetOpen, setIsInvitationSheetOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

   const hasReachedLimit =
      (organizations?.length ?? 0) >= (organizationLimit ?? 3);

   const quickActions = [
      {
         icon: <Edit className="size-4" />,
         label: "Edit Organization",
         onClick: () => setIsEditSheetOpen(true),
         variant: "outline" as const,
      },
      {
         icon: <Plus className="size-4" />,
         label: "Add new Organization",
         onClick: () => setIsCreateSheetOpen(true),
         variant: "outline" as const,
         disabled: hasReachedLimit,
         tooltip: hasReachedLimit
            ? "Você não pode criar mais organizações"
            : "Add new Organization",
      },
      {
         icon: <UserPlus className="size-4" />,
         label: "Add new Member",
         onClick: () => setIsInvitationSheetOpen(true),
         variant: "outline" as const,
      },
      {
         icon: <Trash2 className="size-4" />,
         label: "Delete Organization",
         onClick: () => setIsDeleteDialogOpen(true),
         variant: "destructive" as const,
      },
   ];

   return (
      <>
         <Item variant="outline">
            <ItemContent>
               <ItemTitle>Actions Toolbar</ItemTitle>
               <ItemDescription>Common tasks and operations</ItemDescription>
            </ItemContent>
            <ItemActions>
               <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                     <Tooltip key={`quick-action-${index + 1}`}>
                        <TooltipTrigger asChild>
                           <Button
                              disabled={action.disabled}
                              onClick={action.onClick}
                              size="icon"
                              variant={action.variant}
                           >
                              {action.icon}
                           </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>{action.tooltip ?? action.label}</p>
                        </TooltipContent>
                     </Tooltip>
                  ))}
               </div>
            </ItemActions>
         </Item>

         <EditOrganizationSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
         <EditOrganizationSheet
            onOpen={isEditSheetOpen}
            onOpenChange={setIsEditSheetOpen}
            organization={activeOrganization || undefined}
         />
         <SendInvitationSheet
            onOpenChange={setIsInvitationSheetOpen}
            open={isInvitationSheetOpen}
         />
         <DeleteOrganizationDialog
            onOpenChange={setIsDeleteDialogOpen}
            open={isDeleteDialogOpen}
         />
      </>
   );
}
