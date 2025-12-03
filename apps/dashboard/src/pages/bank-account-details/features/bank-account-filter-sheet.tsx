import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
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
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import { X } from "lucide-react";

type BankAccountFilterSheetProps = {
   categoryFilter: string;
   typeFilter: string;
   pageSize: number;
   onCategoryFilterChange: (value: string) => void;
   onTypeFilterChange: (value: string) => void;
   onPageSizeChange: (value: number) => void;
   categories: Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
   }>;
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
};

export function BankAccountFilterSheet({
   categoryFilter,
   typeFilter,
   pageSize,
   onCategoryFilterChange,
   onTypeFilterChange,
   onPageSizeChange,
   categories,
   isOpen,
   onOpenChange,
}: BankAccountFilterSheetProps) {
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

   const typeOptions = [
      {
         label: translate(
            "dashboard.routes.transactions.features.filter.items.all-types",
         ),
         value: "all",
      },
      {
         label: translate(
            "dashboard.routes.transactions.list-section.types.income",
         ),
         value: "income",
      },
      {
         label: translate(
            "dashboard.routes.transactions.list-section.types.expense",
         ),
         value: "expense",
      },
      {
         label: translate(
            "dashboard.routes.transactions.list-section.types.transfer",
         ),
         value: "transfer",
      },
   ];

   const hasActiveFilters = categoryFilter !== "all" || typeFilter !== "all";

   const clearFilters = () => {
      onCategoryFilterChange("all");
      onTypeFilterChange("all");
   };

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
                        onClick={clearFilters}
                     >
                        <X className="size-4" />
                        {translate(
                           "dashboard.routes.transactions.features.filter.actions.clear-filters",
                        )}
                     </Button>
                  </div>
               )}
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

               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("common.form.type.label")}
                     </FieldLabel>
                     <Select
                        onValueChange={onTypeFilterChange}
                        value={typeFilter}
                     >
                        <SelectTrigger>
                           <SelectValue
                              placeholder={translate(
                                 "common.form.type.placeholder",
                              )}
                           />
                        </SelectTrigger>
                        <SelectContent>
                           {typeOptions.map((option) => (
                              <SelectItem
                                 key={option.value}
                                 value={option.value}
                              >
                                 {option.label}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </Field>
               </FieldGroup>

               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate(
                           "dashboard.routes.transactions.features.filter.page-size.label",
                        )}
                     </FieldLabel>
                     <Select
                        onValueChange={(value) =>
                           onPageSizeChange(Number(value))
                        }
                        value={pageSize.toString()}
                     >
                        <SelectTrigger>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           {[5, 10, 20, 30, 50].map((size) => (
                              <SelectItem key={size} value={size.toString()}>
                                 {size}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </Field>
               </FieldGroup>
            </div>
         </SheetContent>
      </Sheet>
   );
}
