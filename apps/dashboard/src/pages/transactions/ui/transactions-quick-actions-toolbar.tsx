import {
   Item,
   ItemContent,
   ItemDescription,
   ItemTitle,
   ItemActions,
} from "@packages/ui/components/item";
import { AddTransactionSheet } from "../features/add-transaction-sheet";

export function TransactionsQuickActionsToolbar() {
   return (
      <Item variant="outline">
         <ItemContent>
            <ItemTitle>Transactions Actions</ItemTitle>
            <ItemDescription>
               Manage your financial transactions
            </ItemDescription>
         </ItemContent>
         <ItemActions>
            <AddTransactionSheet />
         </ItemActions>
      </Item>
   );
}

