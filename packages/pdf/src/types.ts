import type {
   DRESnapshotData,
   ReportType,
} from "@packages/database/schemas/custom-reports";

export type { ReportType };

// Report types that have PDF templates implemented
export type SupportedPdfReportType = "dre_gerencial" | "dre_fiscal";

// Type guard to check if a report type has a PDF template
export function isSupportedPdfReportType(
   type: ReportType,
): type is SupportedPdfReportType {
   return type === "dre_gerencial" || type === "dre_fiscal";
}

export type DREReportProps = {
   name: string;
   type: SupportedPdfReportType;
   startDate: string;
   endDate: string;
   snapshotData: DRESnapshotData;
};

export type ChartDataPoint = {
   label: string;
   value: number;
   color: string;
};

export type BarChartData = {
   labels: string[];
   datasets: Array<{
      label: string;
      data: number[];
      color: string;
   }>;
};
