import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
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
      startDate,
      endDate,
      pageSize,
      setCategoryFilter,
      setStatusFilter,
      setTypeFilter,
      setStartDate,
      setEndDate,
      setPageSize,
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

   const handleStartDateChange = (date: Date | undefined) => {
      setStartDate(date);
      handleFilterChange();
   };

   const handleEndDateChange = (date: Date | undefined) => {
      setEndDate(date);
      handleFilterChange();
   };

   const handlePageSizeChange = (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
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
      typeFilter !== "all" ||
      startDate !== undefined ||
      endDate !== undefined;

   const clearFilters = () => {
      handleCategoryFilterChange("all");
      handleStatusFilterChange("all");
      handleTypeFilterChange("all");
      handleStartDateChange(undefined);
      handleEndDateChange(undefined);
   };

   return (
      <Sheet onOpenChange={handleOpenChange} open={isFilterSheetOpen}>
         <SheetContent className="" side="right">
            <SheetHeader>
               <SheetTitle>
                  {translate("dashboard.routes.bills.features.filter.title")}
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
                        className="w-full flex items-center justify-center gap-2 "
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
                        {translate("dashboard.routes.transactions.features.filter.start-date.label")}
                     </FieldLabel>
                     <DatePicker
                        date={startDate}
                        onSelect={handleStartDateChange}
                        placeholder={translate(
                           "dashboard.routes.transactions.features.filter.start-date.placeholder",
                        )}
                     />
                  </Field>
               </FieldGroup>

               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("dashboard.routes.transactions.features.filter.end-date.label")}
                     </FieldLabel>
                     <DatePicker
                        date={endDate}
                        onSelect={handleEndDateChange}
                        placeholder={translate(
                           "dashboard.routes.transactions.features.filter.end-date.placeholder",
                        )}
                     />
                  </Field>
               </FieldGroup>

               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("dashboard.routes.transactions.features.filter.page-size.label")}
                     </FieldLabel>
                     <Select
                        onValueChange={(value) => handlePageSizeChange(Number(value))}
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
