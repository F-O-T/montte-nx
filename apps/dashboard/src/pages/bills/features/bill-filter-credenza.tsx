import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { DatePicker } from "@packages/ui/components/date-picker";
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

type BillFilterCredenzaProps = {
   categories: Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
   }>;
   categoryFilter: string;
   statusFilter: string;
   typeFilter: string;
   startDate: Date | null;
   endDate: Date | null;
   pageSize: number;
   onCategoryFilterChange: (value: string) => void;
   onStatusFilterChange: (value: string) => void;
   onTypeFilterChange: (value: string) => void;
   onStartDateChange: (date: Date | undefined) => void;
   onEndDateChange: (date: Date | undefined) => void;
   onPageSizeChange: (size: number) => void;
};

export function BillFilterCredenza({
   categories,
   categoryFilter,
   statusFilter,
   typeFilter,
   startDate,
   endDate,
   pageSize,
   onCategoryFilterChange,
   onStatusFilterChange,
   onTypeFilterChange,
   onStartDateChange,
   onEndDateChange,
   onPageSizeChange,
}: BillFilterCredenzaProps) {
   const { closeCredenza } = useCredenza();

   const categoryOptions = [
      {
         label: translate(
            "dashboard.routes.bills.features.filter.items.all-categories",
         ),
         value: "all",
      },
      ...categories.map((category) => ({
         label: category.name,
         value: category.id,
      })),
   ];

   const statusOptions = [
      {
         label: translate(
            "dashboard.routes.bills.features.filter.items.all-statuses",
         ),
         value: "all",
      },
      {
         label: translate(
            "dashboard.routes.bills.features.filter.items.status-pending",
         ),
         value: "pending",
      },
      {
         label: translate(
            "dashboard.routes.bills.features.filter.items.status-overdue",
         ),
         value: "overdue",
      },
      {
         label: translate(
            "dashboard.routes.bills.features.filter.items.status-completed",
         ),
         value: "completed",
      },
   ];

   const typeOptions = [
      {
         label: translate(
            "dashboard.routes.bills.features.filter.items.all-types",
         ),
         value: "all",
      },
      {
         label: translate(
            "dashboard.routes.bills.features.filter.items.type-payable",
         ),
         value: "payable",
      },
      {
         label: translate(
            "dashboard.routes.bills.features.filter.items.type-receivable",
         ),
         value: "receivable",
      },
   ];

   const hasActiveFilters =
      categoryFilter !== "all" ||
      statusFilter !== "all" ||
      typeFilter !== "all" ||
      startDate !== null ||
      endDate !== null;

   const clearFilters = () => {
      onCategoryFilterChange("all");
      onStatusFilterChange("all");
      onTypeFilterChange("all");
      onStartDateChange(undefined);
      onEndDateChange(undefined);
      closeCredenza();
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>
               {translate("dashboard.routes.bills.features.filter.title")}
            </CredenzaTitle>
            <CredenzaDescription>
               {translate("dashboard.routes.bills.features.filter.description")}
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
                           "dashboard.routes.bills.features.filter.actions.clear-filters",
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
                        {translate("common.form.status.label")}
                     </FieldLabel>
                     <Select
                        onValueChange={onStatusFilterChange}
                        value={statusFilter}
                     >
                        <SelectTrigger>
                           <SelectValue
                              placeholder={translate(
                                 "common.form.status.placeholder",
                              )}
                           />
                        </SelectTrigger>
                        <SelectContent>
                           {statusOptions.map((option) => (
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
                           "dashboard.routes.transactions.features.filter.start-date.label",
                        )}
                     </FieldLabel>
                     <DatePicker
                        date={startDate ?? undefined}
                        onSelect={onStartDateChange}
                        placeholder={translate(
                           "dashboard.routes.transactions.features.filter.start-date.placeholder",
                        )}
                     />
                  </Field>
               </FieldGroup>

               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate(
                           "dashboard.routes.transactions.features.filter.end-date.label",
                        )}
                     </FieldLabel>
                     <DatePicker
                        date={endDate ?? undefined}
                        onSelect={onEndDateChange}
                        placeholder={translate(
                           "dashboard.routes.transactions.features.filter.end-date.placeholder",
                        )}
                     />
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
         </CredenzaBody>
      </>
   );
}
