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
import { Separator } from "@packages/ui/components/separator";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import {
   ArrowDownAZ,
   ArrowUpAZ,
   Building2,
   CheckCircle2,
   User,
   Users,
   X,
   XCircle,
} from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";

type CounterpartyFilterCredenzaProps = {
   // Type filter
   typeFilter: "client" | "supplier" | "both" | "all";
   onTypeFilterChange: (value: "client" | "supplier" | "both" | "all") => void;

   // Status filter
   statusFilter: "active" | "inactive" | "all";
   onStatusFilterChange: (value: "active" | "inactive" | "all") => void;

   // Industry filter
   industryFilter: string;
   onIndustryFilterChange: (value: string) => void;
   industries: string[];

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

export function CounterpartyFilterCredenza({
   typeFilter,
   onTypeFilterChange,
   statusFilter,
   onStatusFilterChange,
   industryFilter,
   onIndustryFilterChange,
   industries,
   startDate,
   endDate,
   onDateRangeChange,
   orderDirection,
   onOrderDirectionChange,
   pageSize,
   onPageSizeChange,
   onClearFilters,
   hasActiveFilters,
}: CounterpartyFilterCredenzaProps) {
   const { closeCredenza } = useCredenza();

   const industryOptions = [
      { label: "Todos os setores", value: "all" },
      ...industries.map((industry) => ({
         label: industry,
         value: industry,
      })),
   ];

   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>Filtros</CredenzaTitle>
            <CredenzaDescription>
               Filtre a lista de parceiros comerciais
            </CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody>
            <div className="grid gap-5">
               {/* Type Filter */}
               <FieldGroup>
                  <Field>
                     <FieldLabel>Tipo</FieldLabel>
                     <ToggleGroup
                        className="justify-start flex-wrap"
                        onValueChange={(value) => {
                           if (value) {
                              onTypeFilterChange(
                                 value as
                                    | "client"
                                    | "supplier"
                                    | "both"
                                    | "all",
                              );
                           }
                        }}
                        type="single"
                        value={typeFilter}
                        variant="outline"
                     >
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
                           value="all"
                        >
                           Todos
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-emerald-500 data-[state=on]:text-emerald-600"
                           value="client"
                        >
                           <User className="size-3.5" />
                           Clientes
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-blue-500 data-[state=on]:text-blue-600"
                           value="supplier"
                        >
                           <Building2 className="size-3.5" />
                           Fornec.
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-purple-500 data-[state=on]:text-purple-600"
                           value="both"
                        >
                           <Users className="size-3.5" />
                           Ambos
                        </ToggleGroupItem>
                     </ToggleGroup>
                  </Field>
               </FieldGroup>

               {/* Status Filter */}
               <FieldGroup>
                  <Field>
                     <FieldLabel>Status</FieldLabel>
                     <ToggleGroup
                        className="justify-start"
                        onValueChange={(value) => {
                           if (value) {
                              onStatusFilterChange(
                                 value as "active" | "inactive" | "all",
                              );
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
                           Todos
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-emerald-500 data-[state=on]:text-emerald-600"
                           value="active"
                        >
                           <CheckCircle2 className="size-3.5" />
                           Ativos
                        </ToggleGroupItem>
                        <ToggleGroupItem
                           className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-destructive data-[state=on]:text-destructive"
                           value="inactive"
                        >
                           <XCircle className="size-3.5" />
                           Inativos
                        </ToggleGroupItem>
                     </ToggleGroup>
                  </Field>
               </FieldGroup>

               <Separator />

               {/* Industry Filter */}
               <FieldGroup>
                  <Field>
                     <FieldLabel>Setor de atuação</FieldLabel>
                     <Combobox
                        emptyMessage="Nenhum setor encontrado"
                        onValueChange={onIndustryFilterChange}
                        options={industryOptions}
                        placeholder="Selecione o setor"
                        searchPlaceholder="Buscar setor..."
                        value={industryFilter}
                     />
                  </Field>
               </FieldGroup>

               {/* Date Range */}
               <div className="grid grid-cols-2 gap-3">
                  <FieldGroup>
                     <Field>
                        <FieldLabel>Data inicial</FieldLabel>
                        <DatePicker
                           className="w-full"
                           date={startDate || undefined}
                           onSelect={(date: Date | undefined) =>
                              onDateRangeChange({
                                 startDate: date || null,
                                 endDate,
                              })
                           }
                           placeholder="Selecionar"
                        />
                     </Field>
                  </FieldGroup>
                  <FieldGroup>
                     <Field>
                        <FieldLabel>Data final</FieldLabel>
                        <DatePicker
                           className="w-full"
                           date={endDate || undefined}
                           onSelect={(date: Date | undefined) =>
                              onDateRangeChange({
                                 startDate,
                                 endDate: date || null,
                              })
                           }
                           placeholder="Selecionar"
                        />
                     </Field>
                  </FieldGroup>
               </div>

               <Separator />

               {/* Sorting */}
               <FieldGroup>
                  <Field>
                     <FieldLabel>Ordenação</FieldLabel>
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
                     <FieldLabel>Itens por página</FieldLabel>
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
                  onClick={onClearFilters}
                  variant="outline"
               >
                  <X className="size-4 mr-2" />
                  Limpar filtros
               </Button>
            )}
            <Button className="flex-1" onClick={() => closeCredenza()}>
               Aplicar
            </Button>
         </CredenzaFooter>
      </>
   );
}
