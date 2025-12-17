import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { DefaultHeader } from "@/default/default-header";
import { ManageBankAccountForm } from "@/features/bank-account/ui/manage-bank-account-form";
import { useSheet } from "@/hooks/use-sheet";
import { BankAccountsFilterBar } from "./bank-accounts-filter-bar";
import { BankAccountsListSection } from "./bank-accounts-list-section";
import { BankAccountsStats } from "./bank-accounts-stats";

export function BankAccountsPage() {
   const { openSheet } = useSheet();

   const [statusFilter, setStatusFilter] = useState<string>("");
   const [typeFilter, setTypeFilter] = useState<string>("");

   const hasActiveFilters = statusFilter !== "" || typeFilter !== "";

   const handleClearFilters = () => {
      setStatusFilter("");
      setTypeFilter("");
   };

   return (
      <main className=" space-y-4">
         <DefaultHeader
            actions={
               <Button
                  onClick={() =>
                     openSheet({ children: <ManageBankAccountForm /> })
                  }
               >
                  <Plus className="size-4" />
                  {translate(
                     "dashboard.routes.bank-accounts.list-section.actions.add-new",
                  )}
               </Button>
            }
            description={translate(
               "dashboard.routes.bank-accounts.list-section.description",
            )}
            title={translate(
               "dashboard.routes.bank-accounts.list-section.title",
            )}
         />
         <BankAccountsFilterBar
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
            onStatusFilterChange={setStatusFilter}
            onTypeFilterChange={setTypeFilter}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
         />
         <BankAccountsStats
            statusFilter={statusFilter}
            typeFilter={typeFilter}
         />
         <BankAccountsListSection
            statusFilter={statusFilter}
            typeFilter={typeFilter}
         />
      </main>
   );
}
