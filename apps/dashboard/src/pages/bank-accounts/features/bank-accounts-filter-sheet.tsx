import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";

interface BankAccountsFilterSheetProps {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   statusFilter: string;
   onStatusFilterChange: (value: string) => void;
   typeFilter: string;
   onTypeFilterChange: (value: string) => void;
   sortBy: string;
   onSortByChange: (value: string) => void;
   onClearFilters: () => void;
}

export function BankAccountsFilterSheet({
   isOpen,
   onOpenChange,
   statusFilter,
   onStatusFilterChange,
   typeFilter,
   onTypeFilterChange,
   sortBy,
   onSortByChange,
   onClearFilters,
}: BankAccountsFilterSheetProps) {
   const handleApply = () => {
      onOpenChange(false);
   };

   const handleClear = () => {
      onClearFilters();
      onOpenChange(false);
   };

   return (
      <Sheet onOpenChange={onOpenChange} open={isOpen}>
         <SheetContent className="flex flex-col" side="bottom">
            <SheetHeader>
               <SheetTitle>Filtrar Contas</SheetTitle>
               <SheetDescription>
                  Personalize sua visualização aplicando filtros
               </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 py-6">
               <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                     onValueChange={onStatusFilterChange}
                     value={statusFilter || "all"}
                  >
                     <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o status" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="active">
                           {translate(
                              "dashboard.routes.bank-accounts.status.active",
                           )}
                        </SelectItem>
                        <SelectItem value="inactive">
                           {translate(
                              "dashboard.routes.bank-accounts.status.inactive",
                           )}
                        </SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <Select
                     onValueChange={onTypeFilterChange}
                     value={typeFilter || "all"}
                  >
                     <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="checking">
                           {translate(
                              "dashboard.routes.bank-accounts.types.checking",
                           )}
                        </SelectItem>
                        <SelectItem value="savings">
                           {translate(
                              "dashboard.routes.bank-accounts.types.savings",
                           )}
                        </SelectItem>
                        <SelectItem value="investment">
                           {translate(
                              "dashboard.routes.bank-accounts.types.investment",
                           )}
                        </SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="space-y-2">
                  <label className="text-sm font-medium">Ordenar por</label>
                  <Select onValueChange={onSortByChange} value={sortBy}>
                     <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a ordenação" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="name">Nome</SelectItem>
                        <SelectItem value="balance">Saldo</SelectItem>
                        <SelectItem value="createdAt">
                           Data de criação
                        </SelectItem>
                        <SelectItem value="bank">Banco</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>

            <SheetFooter className="flex-row gap-2">
               <Button
                  className="flex-1"
                  onClick={handleClear}
                  variant="outline"
               >
                  Limpar Filtros
               </Button>
               <Button className="flex-1" onClick={handleApply}>
                  Aplicar Filtros
               </Button>
            </SheetFooter>
         </SheetContent>
      </Sheet>
   );
}
