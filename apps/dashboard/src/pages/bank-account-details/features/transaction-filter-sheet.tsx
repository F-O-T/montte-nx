import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import {
   Sheet,
   SheetContent,
   SheetDescription,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, X } from "lucide-react";

type TransactionFilterSheetProps = {
   categoryFilter: string;
   typeFilter: string;
   onCategoryFilterChange: (value: string) => void;
   onTypeFilterChange: (value: string) => void;
   onClearFilters: () => void;
   categories: Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
   }>;
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
};

export function TransactionFilterSheet({
   categoryFilter,
   typeFilter,
   onCategoryFilterChange,
   onTypeFilterChange,
   onClearFilters,
   categories,
   isOpen,
   onOpenChange,
}: TransactionFilterSheetProps) {
   const categoryOptions = [
      {
         label: translate(
            "dashboard.routes.transactions.features.filter.items.all-categories",
         ),
         value: "all",
      },
      ...categories.map((category) => ({
         label: category.name,
         value: category.id,
      })),
   ];

   const hasActiveFilters = categoryFilter !== "all" || typeFilter !== "";

   return (
      <Sheet onOpenChange={onOpenChange} open={isOpen}>
         <SheetContent side="right">
            <SheetHeader>
               <SheetTitle>
                  {translate(
                     "dashboard.routes.transactions.features.filter.title",
                  )}
               </SheetTitle>
               <SheetDescription>
                  {translate(
                     "dashboard.routes.transactions.features.filter.description",
                  )}
               </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4">
               {hasActiveFilters && (
                  <div className="flex justify-end">
                     <Button
                        className="w-full flex items-center justify-center gap-2"
                        onClick={onClearFilters}
                        variant="outline"
                     >
                        <X className="size-4" />
                        {translate("common.actions.clear-filters")}
                     </Button>
                  </div>
               )}

               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("common.form.type.label")}
                     </FieldLabel>
                     <ToggleGroup
                        className="justify-start"
                        onValueChange={onTypeFilterChange}
                        size="sm"
                        spacing={2}
                        type="single"
                        value={typeFilter}
                        variant="outline"
                     >
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-emerald-500 data-[state=on]:text-emerald-600"
                           value="income"
                        >
                           <ArrowDownLeft className="size-3.5" />
                           {translate(
                              "dashboard.routes.transactions.list-section.types.income",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-red-500 data-[state=on]:text-red-600"
                           value="expense"
                        >
                           <ArrowUpRight className="size-3.5" />
                           {translate(
                              "dashboard.routes.transactions.list-section.types.expense",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-blue-500 data-[state=on]:text-blue-600"
                           value="transfer"
                        >
                           <ArrowLeftRight className="size-3.5" />
                           {translate(
                              "dashboard.routes.transactions.list-section.types.transfer",
                           )}
                        </ToggleGroupItem>
                     </ToggleGroup>
                  </Field>
               </FieldGroup>

               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("common.form.category.label")}
                     </FieldLabel>
                     <Combobox
                        emptyMessage={translate(
                           "common.form.search.no-results",
                        )}
                        onValueChange={onCategoryFilterChange}
                        options={categoryOptions}
                        placeholder={translate(
                           "common.form.category.placeholder",
                        )}
                        searchPlaceholder={translate(
                           "common.form.search.label",
                        )}
                        value={categoryFilter}
                     />
                  </Field>
               </FieldGroup>
            </div>
         </SheetContent>
      </Sheet>
   );
}
