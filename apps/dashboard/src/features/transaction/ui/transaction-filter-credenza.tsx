import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
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
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, X } from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";

type TransactionFilterCredenzaProps = {
   categoryFilter: string;
   typeFilter: string;
   bankAccountFilter?: string;
   pageSize?: number;
   startDate?: Date;
   endDate?: Date;
   onCategoryFilterChange: (value: string) => void;
   onTypeFilterChange: (value: string) => void;
   onBankAccountFilterChange?: (value: string) => void;
   onPageSizeChange?: (value: number) => void;
   onStartDateChange?: (date: Date | undefined) => void;
   onEndDateChange?: (date: Date | undefined) => void;
   onClearFilters?: () => void;
   categories: Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
   }>;
   bankAccounts?: Array<{
      id: string;
      name: string | null;
      bank: string;
   }>;
};

export function TransactionFilterCredenza({
   categoryFilter,
   typeFilter,
   bankAccountFilter = "all",
   pageSize = 10,
   startDate,
   endDate,
   onCategoryFilterChange,
   onTypeFilterChange,
   onBankAccountFilterChange,
   onPageSizeChange,
   onStartDateChange,
   onEndDateChange,
   onClearFilters,
   categories,
   bankAccounts = [],
}: TransactionFilterCredenzaProps) {
   const { closeCredenza } = useCredenza();

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

   const bankAccountOptions = [
      {
         label: translate(
            "dashboard.routes.transactions.features.filter.items.all-accounts",
         ),
         value: "all",
      },
      ...bankAccounts.map((account) => ({
         label: `${account.name ?? "Unnamed Account"} - ${account.bank}`,
         value: account.id,
      })),
   ];

   const hasActiveFilters =
      categoryFilter !== "all" ||
      typeFilter !== "" ||
      bankAccountFilter !== "all" ||
      startDate !== undefined ||
      endDate !== undefined;

   const handleClearFilters = () => {
      if (onClearFilters) {
         onClearFilters();
      } else {
         onCategoryFilterChange("all");
         onTypeFilterChange("");
         onBankAccountFilterChange?.("all");
         onStartDateChange?.(undefined);
         onEndDateChange?.(undefined);
      }
   };

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>
               {translate(
                  "dashboard.routes.transactions.features.filter.title",
               )}
            </CredenzaTitle>
            <CredenzaDescription>
               {translate(
                  "dashboard.routes.transactions.features.filter.description",
               )}
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

               {bankAccounts.length > 0 && onBankAccountFilterChange && (
                  <FieldGroup>
                     <Field>
                        <FieldLabel>
                           {translate("common.form.bank.label")}
                        </FieldLabel>
                        <Select
                           onValueChange={onBankAccountFilterChange}
                           value={bankAccountFilter}
                        >
                           <SelectTrigger>
                              <SelectValue
                                 placeholder={translate(
                                    "common.form.bank.placeholder",
                                 )}
                              />
                           </SelectTrigger>
                           <SelectContent>
                              {bankAccountOptions.map((option) => (
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
               )}

               {onStartDateChange && (
                  <FieldGroup>
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.transactions.features.filter.start-date.label",
                           )}
                        </FieldLabel>
                        <DatePicker
                           date={startDate}
                           onSelect={onStartDateChange}
                           placeholder={translate(
                              "dashboard.routes.transactions.features.filter.start-date.placeholder",
                           )}
                        />
                     </Field>
                  </FieldGroup>
               )}

               {onEndDateChange && (
                  <FieldGroup>
                     <Field>
                        <FieldLabel>
                           {translate(
                              "dashboard.routes.transactions.features.filter.end-date.label",
                           )}
                        </FieldLabel>
                        <DatePicker
                           date={endDate}
                           onSelect={onEndDateChange}
                           placeholder={translate(
                              "dashboard.routes.transactions.features.filter.end-date.placeholder",
                           )}
                        />
                     </Field>
                  </FieldGroup>
               )}

               {onPageSizeChange && (
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
               )}
            </div>
         </CredenzaBody>

         <CredenzaFooter>
            <Button onClick={() => closeCredenza()} variant="outline">
               {translate("common.actions.close")}
            </Button>
         </CredenzaFooter>
      </>
   );
}
