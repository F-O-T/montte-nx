import type { RouterOutput } from "@packages/api/client";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { DefaultHeader } from "@/default/default-header";
import { ManageCustomReportForm } from "@/features/custom-report/ui/manage-custom-report-form";
import { useSheet } from "@/hooks/use-sheet";
import { CustomReportListProvider } from "../features/custom-report-list-context";
import { CustomReportsListSection } from "./custom-reports-list-section";
import { CustomReportsStats } from "./custom-reports-stats";

export type CustomReport =
   RouterOutput["customReports"]["getAllPaginated"]["data"][0];

type CustomReportsPageProps = {
   filterType?: "dre_gerencial" | "dre_fiscal";
};

export function CustomReportsPage({ filterType }: CustomReportsPageProps) {
   const { openSheet } = useSheet();

   return (
      <CustomReportListProvider>
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
               description="Gerencie relatórios DRE Gerencial e Fiscal"
               title="Relatórios Personalizados"
            />
            <CustomReportsStats />
            <CustomReportsListSection filterType={filterType} />
         </main>
      </CustomReportListProvider>
   );
}
