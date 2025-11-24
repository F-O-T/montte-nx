import { translate } from "@packages/localization";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { cn } from "@packages/ui/lib/utils";
import { ArrowRight, Plus } from "lucide-react";

interface CreateBankAccountItemProps {
   onCreateAccount: () => void;
   solid?: boolean;
}
export function CreateBankAccountItem({
   onCreateAccount,
   solid,
}: CreateBankAccountItemProps) {
   return (
      <Item
         className={cn("cursor-pointer hover:bg-muted/50 transition-colors", {
            "bg-card": solid,
         })}
         onClick={onCreateAccount}
         variant={solid ? "outline" : "default"}
      >
         <ItemMedia variant="icon">
            <Plus className="size-4 " />
         </ItemMedia>
         <ItemContent>
            <ItemTitle>
               {translate(
                  "dashboard.routes.profile.bank-accounts.actions.add-account.title",
               )}
            </ItemTitle>
            <ItemDescription>
               {translate(
                  "dashboard.routes.profile.bank-accounts.actions.add-account.description",
               )}
            </ItemDescription>
         </ItemContent>
         <ItemActions>
            <ArrowRight className="size-4" />
         </ItemActions>
      </Item>
   );
}
