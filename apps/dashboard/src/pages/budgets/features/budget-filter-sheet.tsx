import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
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

type BudgetFilterSheetProps = {
   orderBy: "name" | "createdAt" | "updatedAt" | "amount";
   orderDirection: "asc" | "desc";
   pageSize?: number;
   activeFilter?: boolean;
   onOrderByChange: (
      value: "name" | "createdAt" | "updatedAt" | "amount",
   ) => void;
   onOrderDirectionChange: (value: "asc" | "desc") => void;
   onPageSizeChange?: (value: number) => void;
   onActiveFilterChange?: (value: boolean | undefined) => void;
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
};

export function BudgetFilterSheet({
   orderBy,
   orderDirection,
   pageSize,
   activeFilter,
   onOrderByChange,
   onOrderDirectionChange,
   onPageSizeChange,
   onActiveFilterChange,
   isOpen,
   onOpenChange,
}: BudgetFilterSheetProps) {
   const orderByOptions = [
      {
         label: translate("common.form.name.label"),
         value: "name" as const,
      },
      {
         label: translate("dashboard.routes.budgets.form.amount.label"),
         value: "amount" as const,
      },
      {
         label: translate("common.form.created-at.label"),
         value: "createdAt" as const,
      },
      {
         label: translate("common.form.updated-at.label"),
         value: "updatedAt" as const,
      },
   ];

   const orderDirectionOptions = [
      {
         label: translate("common.form.sort-ascending.label"),
         value: "asc" as const,
      },
      {
         label: translate("common.form.sort-descending.label"),
         value: "desc" as const,
      },
   ];

   const hasActiveFilters =
      orderBy !== "name" ||
      orderDirection !== "asc" ||
      activeFilter !== undefined;

   const clearFilters = () => {
      onOrderByChange("name");
      onOrderDirectionChange("asc");
      onActiveFilterChange?.(undefined);
   };

   return (
      <Sheet onOpenChange={onOpenChange} open={isOpen}>
         <SheetContent className="" side="right">
            <SheetHeader>
               <SheetTitle>
                  {translate("dashboard.routes.budgets.features.filter.title")}
               </SheetTitle>
               <SheetDescription>
                  {translate(
                     "dashboard.routes.budgets.features.filter.description",
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
                        {translate("common.actions.clear-filters")}
                     </Button>
                  </div>
               )}

               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("common.form.sort-by.label")}
                     </FieldLabel>
                     <Select
                        onValueChange={(
                           value: "name" | "createdAt" | "updatedAt" | "amount",
                        ) => onOrderByChange(value)}
                        value={orderBy}
                     >
                        <SelectTrigger>
                           <SelectValue
                              placeholder={translate(
                                 "common.form.sort-by.placeholder",
                              )}
                           />
                        </SelectTrigger>
                        <SelectContent>
                           {orderByOptions.map((option) => (
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
                        {translate("common.form.order-direction.label")}
                     </FieldLabel>
                     <Select
                        onValueChange={(value: "asc" | "desc") =>
                           onOrderDirectionChange(value)
                        }
                        value={orderDirection}
                     >
                        <SelectTrigger>
                           <SelectValue
                              placeholder={translate(
                                 "common.form.order-direction.placeholder",
                              )}
                           />
                        </SelectTrigger>
                        <SelectContent>
                           {orderDirectionOptions.map((option) => (
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
                           onPageSizeChange?.(Number(value))
                        }
                        value={pageSize?.toString()}
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
