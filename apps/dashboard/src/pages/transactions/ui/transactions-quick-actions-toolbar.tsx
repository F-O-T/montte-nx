import { translate } from "@packages/localization";
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
            <ItemTitle>
               {translate("common.headers.actions-toolbar.title")}
            </ItemTitle>
            <ItemDescription>
               {translate("common.headers.actions-toolbar.description")}
            </ItemDescription>
         </ItemContent>
         <ItemActions>
            <AddTransactionSheet />
         </ItemActions>
      </Item>
   );
}
