import type { RouterOutput } from "@packages/api/client";
import type { ReportType } from "@packages/database/schemas/custom-reports";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { DefaultHeader } from "@/default/default-header";
import { ManageCustomReportForm } from "@/features/custom-report/ui/manage-custom-report-form";
import { useSheet } from "@/hooks/use-sheet";
import {
   CustomReportListProvider,
   useCustomReportList,
} from "../features/custom-report-list-context";
import { CustomReportFilterBar } from "./custom-report-filter-bar";
import { CustomReportsListSection } from "./custom-reports-list-section";
import { CustomReportsStats } from "./custom-reports-stats";

export type CustomReport =
   RouterOutput["customReports"]["getAllPaginated"]["data"][0];

type CustomReportsPageProps = {
   filterType?: ReportType;
};

function CustomReportsPageContent({ filterType }: CustomReportsPageProps) {
   const { openSheet } = useSheet();
   const { typeFilter, setTypeFilter, hasActiveFilters, clearFilters } =
      useCustomReportList();

   return (
      <main className="space-y-4">
         <DefaultHeader
            actions={
               <Button
                  onClick={() =>
                     openSheet({ children: <ManageCustomReportForm /> })
                  }
               >
                  <Plus className="size-4" />
                  Criar Relatório
               </Button>
            }
            description="Gerencie seus relatórios financeiros personalizados"
            title="Relatórios"
         />
         {!filterType && (
            <CustomReportFilterBar
               hasActiveFilters={hasActiveFilters}
               onClearFilters={clearFilters}
               onTypeFilterChange={setTypeFilter}
               typeFilter={typeFilter}
            />
         )}
         <CustomReportsStats />
         <CustomReportsListSection filterType={filterType} />
      </main>
   );
}

export function CustomReportsPage({ filterType }: CustomReportsPageProps) {
   return (
      <CustomReportListProvider>
         <CustomReportsPageContent filterType={filterType} />
      </CustomReportListProvider>
   );
}
