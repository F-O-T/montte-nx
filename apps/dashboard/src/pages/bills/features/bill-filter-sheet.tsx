import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { DatePicker } from "@packages/ui/components/date-picker";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import { Input } from "@packages/ui/components/input";
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
import { useBillList } from "./bill-list-context";

type BillFilterSheetProps = {
   categories: Array<{
      id: string;
      name: string;
      color: string;
      icon: string | null;
   }>;
   isOpen?: boolean;
   onOpenChange?: (open: boolean) => void;
};

export function BillFilterSheet({
   categories,
   isOpen,
   onOpenChange,
}: BillFilterSheetProps) {
   const {
      categoryFilter,
      statusFilter,
      typeFilter,
      selectedMonth,
      setCategoryFilter,
      setStatusFilter,
      setTypeFilter,
      setSelectedMonth,
      setCurrentPage,
      isFilterSheetOpen,
      setIsFilterSheetOpen,
   } = useBillList();

   const handleFilterChange = () => {
      setCurrentPage(1);
   };

   const handleCategoryFilterChange = (value: string) => {
      setCategoryFilter(value);
      handleFilterChange();
   };

   const handleStatusFilterChange = (value: string) => {
      setStatusFilter(value);
      handleFilterChange();
   };

   const handleTypeFilterChange = (value: string) => {
      setTypeFilter(value);
      handleFilterChange();
   };

   const handleMonthChange = (date: Date | undefined) => {
      setSelectedMonth(date || new Date());
      handleFilterChange();
   };

   const handleOpenChange = (open: boolean) => {
      setIsFilterSheetOpen(open);
      onOpenChange?.(open);
   };
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
      typeFilter !== "all";

   const clearFilters = () => {
      handleCategoryFilterChange("all");
      handleStatusFilterChange("all");
      handleTypeFilterChange("all");
   };

   return (
      <Sheet open={isFilterSheetOpen} onOpenChange={handleOpenChange}>
         <SheetContent side="right" className="">
            <SheetHeader>
               <SheetTitle>
                  {translate(
                     "dashboard.routes.bills.features.filter.title",
                  )}
               </SheetTitle>
               <SheetDescription>
                  {translate(
                     "dashboard.routes.bills.features.filter.description",
                  )}
               </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-4">
               {hasActiveFilters && (
                  <div className="flex justify-end">
                     <Button
                        onClick={clearFilters}
                        className="w-full flex items-center justify-center gap-2 "
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
                        onValueChange={handleCategoryFilterChange}
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
                        onValueChange={handleStatusFilterChange}
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
                        onValueChange={handleTypeFilterChange}
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
                        {translate("dashboard.routes.bills.features.filter.month.label")}
                     </FieldLabel>
                     <DatePicker
                        date={selectedMonth}
                        onSelect={handleMonthChange}
                        placeholder={translate("dashboard.routes.bills.features.filter.month.placeholder")}
                     />
                  </Field>
               </FieldGroup>
            </div>
         </SheetContent>
      </Sheet>
   );
}