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
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { Edit, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/integrations/clients";
import { ManageBankAccountSheet } from "@/pages/profile/features/manage-bank-account-sheet";
import { DeleteBankAccountDialog } from "../features/delete-bank-account-dialog";

export function BankAccountQuickActionsToolbar({
   bankAccountId,
}: {
   bankAccountId: string;
}) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
   const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const { data: bankAccount } = useSuspenseQuery(
      trpc.bankAccounts.getById.queryOptions({ id: bankAccountId }),
   );

   const parseOfxMutation = useMutation(
      trpc.bankAccounts.parseOfx.mutationOptions({
         onError: (error) => {
            toast.error(`Failed to parse OFX: ${error.message}`);
         },
         onSuccess: (data) => {
            toast.success(`Imported ${data.length} transactions.`);
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getTransactions.queryKey({
                  id: bankAccountId,
               }),
            });
            queryClient.invalidateQueries({
               queryKey: trpc.bankAccounts.getById.queryKey({
                  id: bankAccountId,
               }),
            });
         },
      }),
   );

   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
         const content = e.target?.result as string;
         parseOfxMutation.mutate({ bankAccountId, content });
         if (fileInputRef.current) {
            fileInputRef.current.value = "";
         }
      };
      reader.readAsText(file);
   };

   const quickActions = [
      {
         icon: <Edit className="size-4" />,
         label: "Edit Account",
         onClick: () => setIsEditSheetOpen(true),
         variant: "outline" as const,
      },
      {
         icon: <Upload className="size-4" />,
         label: "Import OFX",
         onClick: () => fileInputRef.current?.click(),
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
         <DeleteBankAccountDialog
            bankAccountId={bankAccountId}
            onOpenChange={setIsDeleteDialogOpen}
            open={isDeleteDialogOpen}
         />
         <input
            accept=".ofx"
            className="hidden"
            onChange={handleFileUpload}
            ref={fileInputRef}
            type="file"
         />
      </>
   );
}
