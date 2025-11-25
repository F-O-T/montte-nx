import { Badge } from "@packages/ui/components/badge";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { cn } from "@packages/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Building2 } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

interface BankAccountItemProps {
   account: {
      id: string;
      name: string;
      bank: string;
      status: "active" | "inactive" | string;
      type?: string;
   };
   solid?: boolean;
}

export function BankAccountItem({ account, solid }: BankAccountItemProps) {
   const { activeOrganization } = useActiveOrganization();
   return (
      <Link
         className="block"
         params={{ bankAccountId: account.id, slug: activeOrganization.slug }}
         to="/$slug/bank-accounts/$bankAccountId"
      >
         <Item
            className={cn(
               "cursor-pointer hover:bg-muted/50 transition-colors",
               {
                  "bg-card": solid,
               },
            )}
            variant={solid ? "outline" : "default"}
         >
            <ItemMedia variant="icon">
               <Building2 className="size-4" />
            </ItemMedia>
            <ItemContent>
               <ItemTitle className="flex items-center gap-2">
                  {account.name}
                  <Badge
                     variant={
                        account.status === "active" ? "default" : "secondary"
                     }
                  >
                     {account.status === "active" ? "Ativa" : "Inativa"}
                  </Badge>
               </ItemTitle>
               <ItemDescription>
                  {account.bank}
                  {account.type ? ` • ${account.type}` : ""}
               </ItemDescription>
            </ItemContent>
            <ItemActions>
               <ArrowRight className="size-4" />
            </ItemActions>
         </Item>
      </Link>
   );
}
