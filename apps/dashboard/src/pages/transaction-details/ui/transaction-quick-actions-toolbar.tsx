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
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { ManageTransactionSheet } from "@/features/transaction/ui/manage-transaction-sheet";
import { useDeleteTransaction } from "@/features/transaction/ui/use-delete-transaction";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

export function TransactionQuickActionsToolbar({
   transactionId,
}: {
   transactionId: string;
}) {
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();
   const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

   const { data: transaction } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   const handleBack = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/transactions",
      });
   };

   const { deleteTransaction } = useDeleteTransaction({
      onSuccess: handleBack,
      transaction,
   });

   const quickActions = [
      {
         icon: <ArrowLeft className="size-4" />,
         label: translate("common.actions.back"),
         onClick: handleBack,
         variant: "outline" as const,
      },
      {
         icon: <Edit className="size-4" />,
         label: translate("dashboard.routes.transactions.features.edit.title"),
         onClick: () => setIsEditSheetOpen(true),
         variant: "outline" as const,
      },
      {
         icon: <Trash2 className="size-4" />,
         label: translate(
            "dashboard.routes.transactions.list-section.actions.delete",
         ),
         onClick: deleteTransaction,
         variant: "destructive" as const,
      },
   ];

   return (
      <>
         <Item variant="outline">
            <ItemContent className="hidden md:block">
               <ItemTitle>
                  {translate(
                     "dashboard.routes.transactions.details.toolbar.title",
                  )}
               </ItemTitle>
               <ItemDescription>
                  {translate(
                     "dashboard.routes.transactions.details.toolbar.description",
                  )}
               </ItemDescription>
            </ItemContent>
            <ItemActions className="w-full md:w-auto">
               <div className="flex flex-wrap gap-2 w-full md:w-auto justify-between md:justify-end">
                  {quickActions.map((action, index) => (
                     <Tooltip key={`quick-action-${index + 1}`}>
                        <TooltipTrigger asChild>
                           <Button
                              className="flex-1 md:flex-none"
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

         <ManageTransactionSheet
            onOpen={isEditSheetOpen}
            onOpenChange={setIsEditSheetOpen}
            transaction={transaction}
         />
      </>
   );
}
