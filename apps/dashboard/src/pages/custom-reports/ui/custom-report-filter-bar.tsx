import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   ToggleGroup,
   ToggleGroupItem,
} from "@packages/ui/components/toggle-group";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import {
   BarChart3,
   Calculator,
   FileText,
   Filter,
   Target,
   TrendingUp,
   Users,
   Wallet,
   X,
} from "lucide-react";
import { useCredenza } from "@/hooks/use-credenza";
import type { ReportType } from "@packages/database/schemas/custom-reports";
import { CustomReportFilterCredenza } from "@/pages/custom-reports/features/custom-report-filter-credenza";

type CustomReportFilterBarProps = {
   typeFilter: ReportType | undefined;
   onTypeFilterChange: (value: ReportType | undefined) => void;
   hasActiveFilters: boolean;
   onClearFilters: () => void;
};

export function CustomReportFilterBar({
   typeFilter,
   onTypeFilterChange,
   hasActiveFilters,
   onClearFilters,
}: CustomReportFilterBarProps) {
   const isMobile = useIsMobile();
   const { openCredenza } = useCredenza();

   if (isMobile) {
      return (
         <div className="flex items-center gap-2">
            <Button
               className="gap-2"
               onClick={() =>
                  openCredenza({
                     children: (
                        <CustomReportFilterCredenza
                           hasActiveFilters={hasActiveFilters}
                           onClearFilters={onClearFilters}
                           onTypeFilterChange={onTypeFilterChange}
                           typeFilter={typeFilter}
                        />
                     ),
                  })
               }
               size="sm"
               variant={hasActiveFilters ? "default" : "outline"}
            >
               <Filter className="size-4" />
               Filtros
               {typeFilter && (
                  <Badge
                     className="size-5 p-0 justify-center"
                     variant="secondary"
                  >
                     1
                  </Badge>
               )}
            </Button>
         </div>
      );
   }

   return (
      <div className="flex flex-wrap items-center gap-3">
         <ToggleGroup
            onValueChange={(value) => {
               if (value === "all" || value === "") {
                  onTypeFilterChange(undefined);
               } else {
                  onTypeFilterChange(value as ReportType);
               }
            }}
            size="sm"
            spacing={2}
            type="single"
            value={typeFilter || "all"}
            variant="outline"
         >
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
               value="all"
            >
               <FileText className="size-3.5" />
               Todos
            </ToggleGroupItem>
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
               value="dre_gerencial"
            >
               <BarChart3 className="size-3.5" />
               DRE Gerencial
            </ToggleGroupItem>
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
               value="dre_fiscal"
            >
               <Calculator className="size-3.5" />
               DRE Fiscal
            </ToggleGroupItem>
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
               value="budget_vs_actual"
            >
               <Target className="size-3.5" />
               Budget
            </ToggleGroupItem>
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
               value="spending_trends"
            >
               <TrendingUp className="size-3.5" />
               Tendências
            </ToggleGroupItem>
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
               value="cash_flow_forecast"
            >
               <Wallet className="size-3.5" />
               Fluxo
            </ToggleGroupItem>
            <ToggleGroupItem
               className="gap-1.5 data-[state=on]:bg-transparent data-[state=on]:border-primary data-[state=on]:text-primary"
               value="counterparty_analysis"
            >
               <Users className="size-3.5" />
               Parceiros
            </ToggleGroupItem>
         </ToggleGroup>

         {hasActiveFilters && (
            <>
               <div className="h-4 w-px bg-border" />
               <Button
                  className="h-8 text-xs"
                  onClick={onClearFilters}
                  size="sm"
                  variant="outline"
               >
                  <X className="size-3" />
                  Limpar Filtros
               </Button>
            </>
         )}
      </div>
   );
}
