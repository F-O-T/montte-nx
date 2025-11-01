import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Button } from "@packages/ui/components/button";
import {
   Credenza,
   CredenzaBody,
   CredenzaClose,
   CredenzaContent,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import type { LucideIcon } from "lucide-react";
import { AlertTriangleIcon } from "lucide-react";

interface DeleteConfirmationCredenzaProps {
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
   onCancel?: () => void;
   onDelete?: () => void;
   title?: string;
   description?: string;
   message?: string;
   icon?: LucideIcon;
   variant?: "destructive" | "default";
}

const DeleteConfirmationCredenza = ({
   open,
   onOpenChange,
   onCancel,
   onDelete,
   message,
   icon: Icon = AlertTriangleIcon,
   variant = "destructive",
}: DeleteConfirmationCredenzaProps) => {
   const handleCancel = () => {
      onCancel?.();
      onOpenChange?.(false);
   };

   const handleDelete = () => {
      onDelete?.();
      onOpenChange?.(false);
   };

   return (
      <Credenza onOpenChange={onOpenChange} open={open}>
         <CredenzaContent>
            <CredenzaHeader>
               <CredenzaTitle>Confirmation Needed</CredenzaTitle>
               <CredenzaDescription>
                  Are you sure you want to do this? This action cannot
               </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody className="grid gap-4 place-items-center text-center ">
               <Icon className="h-12 w-12" />
               <Alert className="font-semibold" variant={variant}>
                  <AlertDescription>{message}</AlertDescription>
               </Alert>
            </CredenzaBody>
            <CredenzaFooter className="grid grid-cols-2 gap-2">
               <CredenzaClose asChild>
                  <Button onClick={handleCancel} variant="outline">
                     Cancel
                  </Button>
               </CredenzaClose>
               <Button onClick={handleDelete} variant={variant}>
                  Confirm
               </Button>
            </CredenzaFooter>
         </CredenzaContent>
      </Credenza>
   );
};

export { DeleteConfirmationCredenza };
