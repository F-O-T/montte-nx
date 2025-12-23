import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import { DateRangePickerPopover } from "@packages/ui/components/date-range-picker-popover";
import { Field, FieldGroup, FieldLabel } from "@packages/ui/components/field";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Switch } from "@packages/ui/components/switch";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import {
   AlertTriangle,
   ArrowDownAZ,
   ArrowUpAZ,
   CheckCircle2,
   Percent,
   Star,
   TrendingUp,
   X,
   XCircle,
} from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";

type StatusFilter = "active" | "inactive" | "all";
type MonetaryCorrectionFilter = "ipca" | "selic" | "cdi" | "none" | "all";
type InterestTypeFilter = "daily" | "monthly" | "none" | "all";
type PenaltyTypeFilter = "percentage" | "fixed" | "none" | "all";

type InterestTemplateFilterCredenzaProps = {
   // Status filter
   statusFilter: StatusFilter;
   onStatusFilterChange: (value: StatusFilter) => void;

   // Monetary correction filter
   monetaryCorrectionFilter: MonetaryCorrectionFilter;
   onMonetaryCorrectionFilterChange: (value: MonetaryCorrectionFilter) => void;

   // Interest type filter
   interestTypeFilter: InterestTypeFilter;
   onInterestTypeFilterChange: (value: InterestTypeFilter) => void;

   // Penalty type filter
   penaltyTypeFilter: PenaltyTypeFilter;
   onPenaltyTypeFilterChange: (value: PenaltyTypeFilter) => void;

   // Default filter
   isDefaultFilter: boolean | null;
   onIsDefaultFilterChange: (value: boolean | null) => void;

   // Date range
   startDate: Date | null;
   endDate: Date | null;
   onDateRangeChange: (range: {
      startDate: Date | null;
      endDate: Date | null;
   }) => void;

   // Ordering
   orderDirection: "asc" | "desc";
   onOrderDirectionChange: (value: "asc" | "desc") => void;

   // Pagination
   pageSize: number;
   onPageSizeChange: (value: number) => void;

   // Utilities
   onClearFilters: () => void;
   hasActiveFilters: boolean;
};

export function InterestTemplateFilterCredenza({
   statusFilter,
   onStatusFilterChange,
   monetaryCorrectionFilter,
   onMonetaryCorrectionFilterChange,
   interestTypeFilter,
   onInterestTypeFilterChange,
   penaltyTypeFilter,
   onPenaltyTypeFilterChange,
   isDefaultFilter,
   onIsDefaultFilterChange,
   startDate,
   endDate,
   onDateRangeChange,
   orderDirection,
   onOrderDirectionChange,
   pageSize,
   onPageSizeChange,
   onClearFilters,
   hasActiveFilters,
}: InterestTemplateFilterCredenzaProps) {
   const { closeCredenza } = useCredenza();

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>
               {translate(
                  "dashboard.routes.interest-templates.features.filter.title",
               )}
            </CredenzaTitle>
            <CredenzaDescription>
               {translate(
                  "dashboard.routes.interest-templates.features.filter.description",
               )}
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody>
            <div className="grid gap-6">
               {/* Status filter */}
               <FieldGroup>
                  <Field>
                     <FieldLabel className="flex items-center gap-2">
                        <CheckCircle2 className="size-4" />
                        {translate(
                           "dashboard.routes.interest-templates.features.filter.status.label",
                        )}
                     </FieldLabel>
                     <ToggleGroup
                        className="justify-start flex-wrap"
                        onValueChange={(value) => {
                           if (value) {
                              onStatusFilterChange(value as StatusFilter);
                           }
                        }}
                        type="single"
                        value={statusFilter}
                        variant="outline"
                     >
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="all"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.features.filter.status.all",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-emerald-500 data-[state=on]:text-emerald-600"
                           value="active"
                        >
                           <CheckCircle2 className="size-3.5" />
                           {translate(
                              "dashboard.routes.interest-templates.features.filter.status.active",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-destructive data-[state=on]:text-destructive"
                           value="inactive"
                        >
                           <XCircle className="size-3.5" />
                           {translate(
                              "dashboard.routes.interest-templates.features.filter.status.inactive",
                           )}
                        </ToggleGroupItem>
                     </ToggleGroup>
                  </Field>
               </FieldGroup>

               {/* Monetary correction filter */}
               <FieldGroup>
                  <Field>
                     <FieldLabel className="flex items-center gap-2">
                        <TrendingUp className="size-4" />
                        {translate(
                           "dashboard.routes.interest-templates.features.filter.monetary-correction.label",
                        )}
                     </FieldLabel>
                     <ToggleGroup
                        className="justify-start flex-wrap"
                        onValueChange={(value) => {
                           if (value) {
                              onMonetaryCorrectionFilterChange(
                                 value as MonetaryCorrectionFilter,
                              );
                           }
                        }}
                        type="single"
                        value={monetaryCorrectionFilter}
                        variant="outline"
                     >
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="all"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.features.filter.monetary-correction.all",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-blue-500 data-[state=on]:text-blue-600"
                           value="ipca"
                        >
                           IPCA
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-purple-500 data-[state=on]:text-purple-600"
                           value="selic"
                        >
                           SELIC
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-amber-500 data-[state=on]:text-amber-600"
                           value="cdi"
                        >
                           CDI
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-muted-foreground data-[state=on]:text-muted-foreground"
                           value="none"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.features.filter.monetary-correction.none",
                           )}
                        </ToggleGroupItem>
                     </ToggleGroup>
                  </Field>
               </FieldGroup>

               {/* Interest type filter */}
               <FieldGroup>
                  <Field>
                     <FieldLabel className="flex items-center gap-2">
                        <Percent className="size-4" />
                        {translate(
                           "dashboard.routes.interest-templates.features.filter.interest-type.label",
                        )}
                     </FieldLabel>
                     <ToggleGroup
                        className="justify-start flex-wrap"
                        onValueChange={(value) => {
                           if (value) {
                              onInterestTypeFilterChange(
                                 value as InterestTypeFilter,
                              );
                           }
                        }}
                        type="single"
                        value={interestTypeFilter}
                        variant="outline"
                     >
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="all"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.features.filter.interest-type.all",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="daily"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.form.interest-type.daily",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="monthly"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.form.interest-type.monthly",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="none"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.form.interest-type.none",
                           )}
                        </ToggleGroupItem>
                     </ToggleGroup>
                  </Field>
               </FieldGroup>

               {/* Penalty type filter */}
               <FieldGroup>
                  <Field>
                     <FieldLabel className="flex items-center gap-2">
                        <AlertTriangle className="size-4" />
                        {translate(
                           "dashboard.routes.interest-templates.features.filter.penalty-type.label",
                        )}
                     </FieldLabel>
                     <ToggleGroup
                        className="justify-start flex-wrap"
                        onValueChange={(value) => {
                           if (value) {
                              onPenaltyTypeFilterChange(
                                 value as PenaltyTypeFilter,
                              );
                           }
                        }}
                        type="single"
                        value={penaltyTypeFilter}
                        variant="outline"
                     >
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="all"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.features.filter.penalty-type.all",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="percentage"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.form.penalty-type.percentage",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="fixed"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.form.penalty-type.fixed",
                           )}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="none"
                        >
                           {translate(
                              "dashboard.routes.interest-templates.form.penalty-type.none",
                           )}
                        </ToggleGroupItem>
                     </ToggleGroup>
                  </Field>
               </FieldGroup>

               {/* Default Template toggle */}
               <FieldGroup>
                  <Field>
                     <div className="flex items-center justify-between">
                        <FieldLabel className="flex items-center gap-2 mb-0">
                           <Star className="size-4" />
                           {translate(
                              "dashboard.routes.interest-templates.features.filter.is-default.label",
                           )}
                        </FieldLabel>
                        <Switch
                           checked={isDefaultFilter === true}
                           onCheckedChange={(checked) =>
                              onIsDefaultFilterChange(checked ? true : null)
                           }
                        />
                     </div>
                  </Field>
               </FieldGroup>

               {/* Date Range */}
               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate(
                           "dashboard.routes.interest-templates.features.filter.date-range.label",
                        )}
                     </FieldLabel>
                     <DateRangePickerPopover
                        endDate={endDate}
                        onRangeChange={onDateRangeChange}
                        placeholder={translate(
                           "dashboard.routes.interest-templates.features.filter.date-range.placeholder",
                        )}
                        startDate={startDate}
                     />
                  </Field>
               </FieldGroup>

               {/* Sort Order */}
               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("common.form.sort-by.label")}
                     </FieldLabel>
                     <ToggleGroup
                        className="justify-start"
                        onValueChange={(value) => {
                           if (value) {
                              onOrderDirectionChange(value as "asc" | "desc");
                           }
                        }}
                        type="single"
                        value={orderDirection}
                        variant="outline"
                     >
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="asc"
                        >
                           <ArrowUpAZ className="size-3.5" />
                           A-Z
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="desc"
                        >
                           <ArrowDownAZ className="size-3.5" />
                           Z-A
                        </ToggleGroupItem>
                     </ToggleGroup>
                  </Field>
               </FieldGroup>

               {/* Items per page */}
               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate("common.form.items-per-page.label")}
                     </FieldLabel>
                     <Select
                        onValueChange={(value) =>
                           onPageSizeChange(Number(value))
                        }
                        value={String(pageSize)}
                     >
                        <SelectTrigger>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="5">5</SelectItem>
                           <SelectItem value="10">10</SelectItem>
                           <SelectItem value="20">20</SelectItem>
                           <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                     </Select>
                  </Field>
               </FieldGroup>
            </div>
         </CredenzaBody>

         <CredenzaFooter className="flex gap-2">
            {hasActiveFilters && (
               <Button
                  className="flex-1"
                  onClick={() => {
                     onClearFilters();
                  }}
                  variant="outline"
               >
                  <X className="size-4 mr-2" />
                  {translate(
                     "dashboard.routes.interest-templates.features.filter.actions.clear-filters",
                  )}
               </Button>
            )}
            <Button
               className="flex-1"
               onClick={() => closeCredenza()}
               variant={hasActiveFilters ? "default" : "outline"}
            >
               {translate("common.actions.close")}
            </Button>
         </CredenzaFooter>
      </>
   );
}
