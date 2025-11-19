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
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTRPC } from "@/integrations/clients";
import { ManageBankAccountSheet } from "@/pages/profile/features/manage-bank-account-sheet";
import { DeleteBankAccount } from "../features/delete-bank-account";

export function BankAccountQuickActionsToolbar({
   bankAccountId,
}: {
   bankAccountId: string;
}) {
   const trpc = useTRPC();
   const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

   const { data: bankAccount } = useSuspenseQuery(
      trpc.bankAccounts.getById.queryOptions({ id: bankAccountId }),
   );

   const quickActions = [
      {
         icon: <Edit className="size-4" />,
         label: "Edit Account",
         onClick: () => setIsEditSheetOpen(true),
         variant: "outline" as const,
      },
      {
         icon: <Trash2 className="size-4" />,
         label: "Delete Account",
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

         <ManageBankAccountSheet
            bankAccount={bankAccount}
            onOpen={isEditSheetOpen}
            onOpenChange={setIsEditSheetOpen}
         />
         <DeleteBankAccount
            bankAccount={bankAccount}
            open={isDeleteDialogOpen}
            setOpen={setIsDeleteDialogOpen}
         />
      </>
   );
}
