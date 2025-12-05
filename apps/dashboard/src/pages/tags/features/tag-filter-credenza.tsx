import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { X } from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";

type TagFilterCredenzaProps = {
   orderBy: "name" | "createdAt" | "updatedAt";
   orderDirection: "asc" | "desc";
   pageSize?: number;
   onOrderByChange: (value: "name" | "createdAt" | "updatedAt") => void;
   onOrderDirectionChange: (value: "asc" | "desc") => void;
   onPageSizeChange?: (value: number) => void;
};

export function TagFilterCredenza({
   orderBy,
   orderDirection,
   pageSize,
   onOrderByChange,
   onOrderDirectionChange,
   onPageSizeChange,
}: TagFilterCredenzaProps) {
   const { closeCredenza } = useCredenza();

   const orderByOptions = [
      {
         label: translate("common.form.name.label"),
         value: "name" as const,
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
      closeCredenza();
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>
               {translate("dashboard.routes.tags.features.filter.title")}
            </CredenzaTitle>
            <CredenzaDescription>
               {translate("dashboard.routes.tags.features.filter.description")}
            </CredenzaDescription>
         </CredenzaHeader>
         <CredenzaBody>
            <div className="grid gap-4">
               {hasActiveFilters && (
                  <div className="flex justify-end">
                     <Button
                        className="w-full flex items-center justify-center gap-2"
                        onClick={clearFilters}
                     >
                        <X className="size-4" />
                        {translate(
                           "dashboard.routes.tags.features.filter.actions.clear-filters",
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
                           value: "name" | "createdAt" | "updatedAt",
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
         </CredenzaBody>
      </>
   );
}
