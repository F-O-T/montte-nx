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
   SheetFooter,
   SheetHeader,
   SheetTitle,
} from "@packages/ui/components/sheet";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";

type CounterpartyFilterSheetProps = {
   isOpen: boolean;
   onOpenChange: (open: boolean) => void;
   orderDirection: "asc" | "desc";
   onOrderDirectionChange: (value: "asc" | "desc") => void;
   pageSize: number;
   onPageSizeChange: (value: number) => void;
   typeFilter: "client" | "supplier" | "both" | "all";
   onTypeFilterChange: (value: "client" | "supplier" | "both" | "all") => void;
};

export function CounterpartyFilterSheet({
   isOpen,
   onOpenChange,
   orderDirection,
   onOrderDirectionChange,
   pageSize,
   onPageSizeChange,
   typeFilter,
   onTypeFilterChange,
}: CounterpartyFilterSheetProps) {
   return (
      <Sheet onOpenChange={onOpenChange} open={isOpen}>
         <SheetContent side="bottom">
            <SheetHeader>
               <SheetTitle>
                  {translate(
                     "dashboard.routes.counterparties.features.filter.title",
                  )}
               </SheetTitle>
               <SheetDescription>
                  {translate(
                     "dashboard.routes.counterparties.features.filter.description",
                  )}
               </SheetDescription>
            </SheetHeader>

            <div className="grid gap-4 px-4 py-4">
               <FieldGroup>
                  <Field>
                     <FieldLabel>
                        {translate(
                           "dashboard.routes.counterparties.form.type.label",
                        )}
                     </FieldLabel>
                     <Select
                        onValueChange={(value) =>
                           onTypeFilterChange(
                              value as "client" | "supplier" | "both" | "all",
                           )
                        }
                        value={typeFilter}
                     >
                        <SelectTrigger>
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">
                              {translate(
                                 "dashboard.routes.counterparties.type-filter.all",
                              )}
                           </SelectItem>
                           <SelectItem value="client">
                              {translate(
                                 "dashboard.routes.counterparties.type-filter.client",
                              )}
                           </SelectItem>
                           <SelectItem value="supplier">
                              {translate(
                                 "dashboard.routes.counterparties.type-filter.supplier",
                              )}
                           </SelectItem>
                           <SelectItem value="both">
                              {translate(
                                 "dashboard.routes.counterparties.type-filter.both",
                              )}
                           </SelectItem>
                        </SelectContent>
                     </Select>
                  </Field>
               </FieldGroup>

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

            <SheetFooter>
               <Button onClick={() => onOpenChange(false)} variant="outline">
                  {translate("common.actions.close")}
               </Button>
            </SheetFooter>
         </SheetContent>
      </Sheet>
   );
}
