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

type CostCenterFilterSheetProps = {
   orderBy: "name" | "code" | "createdAt" | "updatedAt";
   orderDirection: "asc" | "desc";
   pageSize?: number;
   onOrderByChange: (
      value: "name" | "code" | "createdAt" | "updatedAt",
   ) => void;
   onOrderDirectionChange: (value: "asc" | "desc") => void;
   onPageSizeChange?: (value: number) => void;
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
};

export function CostCenterFilterSheet({
   orderBy,
   orderDirection,
   pageSize,
   onOrderByChange,
   onOrderDirectionChange,
   onPageSizeChange,
   isOpen,
   onOpenChange,
}: CostCenterFilterSheetProps) {
   const orderByOptions = [
      {
         label: translate("common.form.name.label"),
         value: "name" as const,
      },
      {
         label: translate("dashboard.routes.cost-centers.table.columns.code"),
         value: "code" as const,
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

   const hasActiveFilters = orderBy !== "name" || orderDirection !== "asc";

   const clearFilters = () => {
      onOrderByChange("name");
      onOrderDirectionChange("asc");
   };

   return (
      <Sheet onOpenChange={onOpenChange} open={isOpen}>
         <SheetContent className="" side="right">
            <SheetHeader>
               <SheetTitle>
                  {translate(
                     "dashboard.routes.cost-centers.features.filter.title",
                  )}
               </SheetTitle>
               <SheetDescription>
                  {translate(
                     "dashboard.routes.cost-centers.features.filter.description",
                  )}
               </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4">
               {hasActiveFilters && (
                  <div className="flex justify-end">
                     <Button
                        className="w-full flex items-center justify-center gap-2 "
                        onClick={clearFilters}
                     >
                        <X className="size-4" />
                        {translate(
                           "dashboard.routes.cost-centers.features.filter.actions.clear-filters",
                        )}
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
                           value: "name" | "code" | "createdAt" | "updatedAt",
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
