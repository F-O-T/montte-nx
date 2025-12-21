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
import {
   getDateRangeForPeriod,
   TIME_PERIODS,
   type TimePeriod,
   type TimePeriodDateRange,
} from "@packages/ui/components/time-period-chips";
import { cn } from "@packages/ui/lib/utils";
import { X } from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";

type BillFilterCredenzaProps = {
   categories: Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
   }>;
   bankAccounts: Array<{
      id: string;
      name: string | null;
      bank: string;
   }>;
   categoryFilter: string;
   statusFilter: string;
   typeFilter: string;
   bankAccountFilter: string;
   customStartDate: Date | null;
   customEndDate: Date | null;
   pageSize: number;
   timePeriod: TimePeriod | null;
   hasActiveFilters: boolean;
   onCategoryFilterChange: (value: string) => void;
   onStatusFilterChange: (value: string) => void;
   onTypeFilterChange: (value: string) => void;
   onBankAccountFilterChange: (value: string) => void;
   onCustomStartDateChange: (date: Date | undefined) => void;
   onCustomEndDateChange: (date: Date | undefined) => void;
   onPageSizeChange: (size: number) => void;
   onTimePeriodChange: (
      period: TimePeriod | null,
      range: TimePeriodDateRange,
   ) => void;
   onClearFilters: () => void;
};

export function BillFilterCredenza({
   categories,
   bankAccounts,
   categoryFilter,
   statusFilter,
   typeFilter,
   bankAccountFilter,
   customStartDate,
   customEndDate,
   pageSize,
   timePeriod,
   hasActiveFilters,
   onCategoryFilterChange,
   onStatusFilterChange,
   onTypeFilterChange,
   onBankAccountFilterChange,
   onCustomStartDateChange,
   onCustomEndDateChange,
   onPageSizeChange,
   onTimePeriodChange,
   onClearFilters,
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
         value: "expense",
      },
      {
         label: translate(
            "dashboard.routes.bills.features.filter.items.type-receivable",
         ),
         value: "income",
      },
   ];

   const handleClearFilters = () => {
      onClearFilters();
      closeCredenza();
   };

   const handleTimePeriodSelect = (period: TimePeriod) => {
      const range = getDateRangeForPeriod(period);
      onTimePeriodChange(period, range);
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
                        onClick={handleClearFilters}
                        variant="outline"
                     >
                        <X className="size-4" />
                        {translate(
                           "dashboard.routes.bills.features.filter.actions.clear-filters",
                        )}
                     </Button>
                  </div>
               )}

               {/* Time Period Grid */}
               <FieldGroup>
                  <FieldLabel>
                     {translate("common.form.period.label")}
                  </FieldLabel>
                  <div className="grid grid-cols-3 gap-2">
                     {TIME_PERIODS.map((period) => (
                        <Button
                           className={cn(
                              "h-auto py-2 px-3 justify-start",
                              timePeriod === period.value &&
                                 "border-primary bg-primary/5",
                           )}
                           key={period.value}
                           onClick={() => handleTimePeriodSelect(period.value)}
                           size="sm"
                           variant="outline"
                        >
                           <span className="text-xs">{period.label}</span>
                        </Button>
                     ))}
                  </div>
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
                        {translate("common.form.bank-account.label")}
                     </FieldLabel>
                     <Select
                        onValueChange={onBankAccountFilterChange}
                        value={bankAccountFilter}
                     >
                        <SelectTrigger>
                           <SelectValue
                              placeholder={translate(
                                 "common.form.bank-account.placeholder",
                              )}
                           />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">
                              {translate(
                                 "dashboard.routes.transactions.features.filter.items.all-accounts",
                              )}
                           </SelectItem>
                           {bankAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                 {account.name || account.bank}
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
                        date={customStartDate ?? undefined}
                        onSelect={onCustomStartDateChange}
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
                        date={customEndDate ?? undefined}
                        onSelect={onCustomEndDateChange}
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
