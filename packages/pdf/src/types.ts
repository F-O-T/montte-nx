import type { DRESnapshotData } from "@packages/database/schemas/custom-reports";

export type ReportType = "dre_gerencial" | "dre_fiscal";

export type DREReportProps = {
   name: string;
   type: ReportType;
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
