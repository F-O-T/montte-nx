import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Combobox } from "@packages/ui/components/combobox";
import { DateRangePickerPopover } from "@packages/ui/components/date-range-picker-popover";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@packages/ui/components/popover";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { cn } from "@packages/ui/lib/utils";
import {
   Briefcase,
   Building2,
   ChevronDown,
   Filter,
   User,
   Users,
   X,
   XCircle,
} from "lucide-react";
import { useState } from "react";
import { useCredenza } from "@/hooks/use-credenza";
import { CounterpartyFilterCredenza } from "../features/counterparty-filter-credenza";

type CounterpartyFilterBarProps = {
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

   // Utilities
   onClearFilters: () => void;
   hasActiveFilters: boolean;
   pageSize: number;
   onPageSizeChange: (size: number) => void;
};

export function CounterpartyFilterBar({
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
   onClearFilters,
   hasActiveFilters,
   pageSize,
   onPageSizeChange,
}: CounterpartyFilterBarProps) {
   const isMobile = useIsMobile();
   const { openCredenza } = useCredenza();
   const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);

   const activeFilterCount = [
      typeFilter !== "all",
      statusFilter !== "active",
      industryFilter !== "all",
      startDate !== null || endDate !== null,
   ].filter(Boolean).length;

   const hasMoreFilters =
      industryFilter !== "all" || startDate !== null || endDate !== null;

   const industryOptions = [
      { label: "Todos os setores", value: "all" },
      ...industries.map((industry) => ({
         label: industry,
         value: industry,
      })),
   ];

   const openFilterCredenza = () => {
      openCredenza({
         children: (
            <CounterpartyFilterCredenza
               endDate={endDate}
               hasActiveFilters={hasActiveFilters}
               industries={industries}
               industryFilter={industryFilter}
               onClearFilters={onClearFilters}
               onDateRangeChange={onDateRangeChange}
               onIndustryFilterChange={onIndustryFilterChange}
               onOrderDirectionChange={onOrderDirectionChange}
               onPageSizeChange={onPageSizeChange}
               onStatusFilterChange={onStatusFilterChange}
               onTypeFilterChange={onTypeFilterChange}
               orderDirection={orderDirection}
               pageSize={pageSize}
               startDate={startDate}
               statusFilter={statusFilter}
               typeFilter={typeFilter}
            />
         ),
      });
   };

   if (isMobile) {
      return (
         <div className="flex items-center gap-2">
            <Button
               className="gap-2"
               onClick={openFilterCredenza}
               size="sm"
               variant={hasActiveFilters ? "default" : "outline"}
            >
               <Filter className="size-4" />
               Filtros
               {activeFilterCount > 0 && (
                  <Badge
                     className="size-5 p-0 justify-center"
                     variant="secondary"
                  >
                     {activeFilterCount}
                  </Badge>
               )}
            </Button>
         </div>
      );
   }

   return (
      <div className="flex flex-wrap items-center gap-3">
         {/* Type filter */}
         <ToggleGroup
            onValueChange={(value) => {
               if (value) {
                  onTypeFilterChange(
                     value as "client" | "supplier" | "both" | "all",
                  );
               }
            }}
            size="sm"
            spacing={2}
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
               Fornecedores
            </ToggleGroupItem>
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-purple-500 data-[state=on]:text-purple-600"
               value="both"
            >
               <Users className="size-3.5" />
               Ambos
            </ToggleGroupItem>
         </ToggleGroup>

         <div className="h-4 w-px bg-border" />

         {/* Status filter */}
         <ToggleGroup
            onValueChange={(value) =>
               onStatusFilterChange(
                  (value || "active") as "active" | "inactive" | "all",
               )
            }
            size="sm"
            spacing={2}
            type="single"
            value={statusFilter === "active" ? "" : statusFilter}
            variant="outline"
         >
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-muted-foreground data-[state=on]:text-muted-foreground"
               value="all"
            >
               Todos status
            </ToggleGroupItem>
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-destructive data-[state=on]:text-destructive"
               value="inactive"
            >
               <XCircle className="size-3.5" />
               Inativos
            </ToggleGroupItem>
         </ToggleGroup>

         <div className="h-4 w-px bg-border" />

         {/* More filters popover */}
         <Popover onOpenChange={setMoreFiltersOpen} open={moreFiltersOpen}>
            <PopoverTrigger asChild>
               <Button
                  className={cn(
                     "gap-1.5 pr-2",
                     hasMoreFilters && "border-primary text-primary",
                  )}
                  size="sm"
                  variant="outline"
               >
                  <Filter className="size-3.5" />
                  Mais filtros
                  <ChevronDown
                     className={cn(
                        "size-3.5 transition-transform",
                        moreFiltersOpen && "rotate-180",
                     )}
                  />
               </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-80 p-0">
               <div className="border-b px-4 py-3">
                  <h4 className="font-medium text-sm">Filtros avançados</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                     Refine sua busca com filtros adicionais
                  </p>
               </div>

               <div className="p-4 space-y-4">
                  <div className="space-y-2">
                     <div className="flex items-center gap-2">
                        <Briefcase className="size-4 text-muted-foreground" />
                        <label className="text-sm font-medium">
                           Setor de atuação
                        </label>
                     </div>
                     <Combobox
                        className="h-9"
                        emptyMessage="Nenhum setor encontrado"
                        onValueChange={onIndustryFilterChange}
                        options={industryOptions}
                        placeholder="Selecione o setor"
                        searchPlaceholder="Buscar setor..."
                        value={industryFilter}
                     />
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium">
                        Data de cadastro
                     </label>
                     <DateRangePickerPopover
                        endDate={endDate}
                        onRangeChange={onDateRangeChange}
                        placeholder="Selecionar período"
                        startDate={startDate}
                     />
                  </div>
               </div>

               {hasMoreFilters && (
                  <div className="border-t px-4 py-3">
                     <Button
                        className="w-full"
                        onClick={() => {
                           onIndustryFilterChange("all");
                           onDateRangeChange({
                              startDate: null,
                              endDate: null,
                           });
                        }}
                        size="sm"
                        variant="ghost"
                     >
                        <X className="size-3.5 mr-2" />
                        Limpar filtros avançados
                     </Button>
                  </div>
               )}
            </PopoverContent>
         </Popover>

         {/* Active filter badges */}
         {industryFilter !== "all" && (
            <Badge
               className="gap-1.5 pl-2 pr-1 cursor-pointer hover:bg-secondary/80"
               onClick={() => onIndustryFilterChange("all")}
               variant="secondary"
            >
               <Briefcase className="size-3" />
               <span className="max-w-24 truncate">{industryFilter}</span>
               <X className="size-3" />
            </Badge>
         )}

         {(startDate || endDate) && (
            <Badge
               className="gap-1.5 pl-2 pr-1 cursor-pointer hover:bg-secondary/80"
               onClick={() =>
                  onDateRangeChange({ startDate: null, endDate: null })
               }
               variant="secondary"
            >
               <span className="max-w-32 truncate">
                  {startDate && endDate
                     ? `${startDate.toLocaleDateString("pt-BR")} - ${endDate.toLocaleDateString("pt-BR")}`
                     : startDate
                       ? `A partir de ${startDate.toLocaleDateString("pt-BR")}`
                       : `Até ${endDate?.toLocaleDateString("pt-BR")}`}
               </span>
               <X className="size-3" />
            </Badge>
         )}

         {hasActiveFilters && (
            <Button
               className="h-8 text-xs"
               onClick={onClearFilters}
               size="sm"
               variant="outline"
            >
               <X className="size-3" />
               Limpar filtros
            </Button>
         )}
      </div>
   );
}
