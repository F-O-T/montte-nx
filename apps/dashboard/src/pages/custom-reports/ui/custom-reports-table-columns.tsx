import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { CollapsibleTrigger } from "@packages/ui/components/collapsible";
import { Separator } from "@packages/ui/components/separator";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { formatDate } from "@packages/utils/date";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
   BarChart3,
   Calculator,
   Calendar,
   ChevronDown,
   Download,
   Edit,
   Eye,
   Trash2,
} from "lucide-react";
import { ManageCustomReportForm } from "@/features/custom-report/ui/manage-custom-report-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useDeleteCustomReport } from "../features/use-delete-custom-report";
import { useExportPdf } from "../features/use-export-pdf";
import type { CustomReport } from "./custom-reports-page";

function CustomReportActionsCell({ report }: { report: CustomReport }) {
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { deleteReport } = useDeleteCustomReport({ report });
   const { exportPdf, isExporting } = useExportPdf();

   return (
      <div className="flex justify-end gap-1">
         <Tooltip>
            <TooltipTrigger asChild>
               <Button asChild size="icon" variant="outline">
                  <Link
                     params={{
                        reportId: report.id,
                        slug: activeOrganization.slug,
                     }}
                     to="/$slug/custom-reports/$reportId"
                  >
                     <Eye className="size-4" />
                  </Link>
               </Button>
            </TooltipTrigger>
            <TooltipContent>Ver Detalhes</TooltipContent>
         </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  disabled={isExporting}
                  onClick={() => exportPdf(report.id)}
                  size="icon"
                  variant="outline"
               >
                  <Download className="size-4" />
               </Button>
            </TooltipTrigger>
            <TooltipContent>Exportar PDF</TooltipContent>
         </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  onClick={() =>
                     openSheet({
                        children: <ManageCustomReportForm report={report} />,
                     })
                  }
                  size="icon"
                  variant="outline"
               >
                  <Edit className="size-4" />
               </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
         </Tooltip>
         <Tooltip>
            <TooltipTrigger asChild>
               <Button
                  className="text-destructive hover:text-destructive"
                  onClick={deleteReport}
                  size="icon"
                  variant="outline"
               >
                  <Trash2 className="size-4" />
               </Button>
            </TooltipTrigger>
            <TooltipContent>Excluir</TooltipContent>
         </Tooltip>
      </div>
   );
}

function ReportTypeBadge({ type }: { type: string }) {
   if (type === "dre_gerencial") {
      return (
         <Badge className="gap-1" variant="outline">
            <BarChart3 className="size-3" />
            DRE Gerencial
         </Badge>
      );
   }
   return (
      <Badge className="gap-1" variant="secondary">
         <Calculator className="size-3" />
         DRE Fiscal
      </Badge>
   );
}

export function createCustomReportColumns(
   _slug: string,
): ColumnDef<CustomReport>[] {
   return [
      {
         accessorKey: "name",
         cell: ({ row }) => {
            const report = row.original;
            return (
               <div className="flex flex-col gap-1">
                  <span className="font-medium">{report.name}</span>
                  {report.description && (
                     <span className="text-sm text-muted-foreground line-clamp-1">
                        {report.description}
                     </span>
                  )}
               </div>
            );
         },
         enableSorting: true,
         header: "Nome",
      },
      {
         accessorKey: "type",
         cell: ({ row }) => <ReportTypeBadge type={row.original.type} />,
         header: "Tipo",
      },
      {
         accessorKey: "startDate",
         cell: ({ row }) => {
            const report = row.original;
            return (
               <span className="text-muted-foreground">
                  {formatDate(new Date(report.startDate), "DD/MM/YYYY")} -{" "}
                  {formatDate(new Date(report.endDate), "DD/MM/YYYY")}
               </span>
            );
         },
         header: "Período",
      },
      {
         accessorKey: "createdAt",
         cell: ({ row }) => {
            const report = row.original;
            return (
               <span className="text-muted-foreground">
                  {formatDate(new Date(report.createdAt), "DD/MM/YYYY")}
               </span>
            );
         },
         header: "Criado em",
      },
      {
         cell: ({ row }) => <CustomReportActionsCell report={row.original} />,
         header: "",
         id: "actions",
      },
   ];
}

interface CustomReportExpandedContentProps {
   row: Row<CustomReport>;
}

export function CustomReportExpandedContent({
   row,
}: CustomReportExpandedContentProps) {
   const report = row.original;
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const isMobile = useIsMobile();
   const { deleteReport } = useDeleteCustomReport({ report });
   const { exportPdf, isExporting } = useExportPdf();

   if (isMobile) {
      return (
         <div className="p-4 space-y-4">
            <div className="space-y-3">
               <div className="flex items-center gap-2">
                  <ReportTypeBadge type={report.type} />
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                     <p className="text-xs text-muted-foreground">Período</p>
                     <p className="text-sm font-medium">
                        {formatDate(new Date(report.startDate), "DD MMM YYYY")}{" "}
                        - {formatDate(new Date(report.endDate), "DD MMM YYYY")}
                     </p>
                  </div>
               </div>
               <Separator />
               <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                     <p className="text-xs text-muted-foreground">Criado em</p>
                     <p className="text-sm font-medium">
                        {formatDate(new Date(report.createdAt), "DD MMM YYYY")}
                     </p>
                  </div>
               </div>
            </div>

            <Separator />

            <div className="space-y-2">
               <Button
                  asChild
                  className="w-full justify-start"
                  size="sm"
                  variant="outline"
               >
                  <Link
                     params={{
                        reportId: report.id,
                        slug: activeOrganization.slug,
                     }}
                     to="/$slug/custom-reports/$reportId"
                  >
                     <Eye className="size-4" />
                     Ver Detalhes
                  </Link>
               </Button>
               <Button
                  className="w-full justify-start"
                  disabled={isExporting}
                  onClick={() => exportPdf(report.id)}
                  size="sm"
                  variant="outline"
               >
                  <Download className="size-4" />
                  Exportar PDF
               </Button>
               <Button
                  className="w-full justify-start"
                  onClick={(e) => {
                     e.stopPropagation();
                     openSheet({
                        children: <ManageCustomReportForm report={report} />,
                     });
                  }}
                  size="sm"
                  variant="outline"
               >
                  <Edit className="size-4" />
                  Editar
               </Button>
               <Button
                  className="w-full justify-start"
                  onClick={(e) => {
                     e.stopPropagation();
                     deleteReport();
                  }}
                  size="sm"
                  variant="destructive"
               >
                  <Trash2 className="size-4" />
                  Excluir
               </Button>
            </div>
         </div>
      );
   }

   return (
      <div className="p-4 flex items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <ReportTypeBadge type={report.type} />
            <Separator className="h-8" orientation="vertical" />
            <div className="flex items-center gap-2">
               <Calendar className="size-4 text-muted-foreground" />
               <div>
                  <p className="text-xs text-muted-foreground">Período</p>
                  <p className="text-sm font-medium">
                     {formatDate(new Date(report.startDate), "DD MMM YYYY")} -{" "}
                     {formatDate(new Date(report.endDate), "DD MMM YYYY")}
                  </p>
               </div>
            </div>
            <Separator className="h-8" orientation="vertical" />
            <div className="flex items-center gap-2">
               <Calendar className="size-4 text-muted-foreground" />
               <div>
                  <p className="text-xs text-muted-foreground">Criado em</p>
                  <p className="text-sm font-medium">
                     {formatDate(new Date(report.createdAt), "DD MMM YYYY")}
                  </p>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
               <Link
                  params={{
                     reportId: report.id,
                     slug: activeOrganization.slug,
                  }}
                  to="/$slug/custom-reports/$reportId"
               >
                  <Eye className="size-4" />
                  Ver Detalhes
               </Link>
            </Button>
            <Button
               disabled={isExporting}
               onClick={() => exportPdf(report.id)}
               size="sm"
               variant="outline"
            >
               <Download className="size-4" />
               Exportar PDF
            </Button>
            <Button
               onClick={(e) => {
                  e.stopPropagation();
                  openSheet({
                     children: <ManageCustomReportForm report={report} />,
                  });
               }}
               size="sm"
               variant="outline"
            >
               <Edit className="size-4" />
               Editar
            </Button>
            <Button
               onClick={(e) => {
                  e.stopPropagation();
                  deleteReport();
               }}
               size="sm"
               variant="destructive"
            >
               <Trash2 className="size-4" />
               Excluir
            </Button>
         </div>
      </div>
   );
}

interface CustomReportMobileCardProps {
   row: Row<CustomReport>;
   isExpanded: boolean;
   toggleExpanded: () => void;
}

export function CustomReportMobileCard({
   row,
   isExpanded,
   toggleExpanded,
}: CustomReportMobileCardProps) {
   const report = row.original;

   return (
      <Card className={isExpanded ? "rounded-b-none border-b-0" : ""}>
         <CardHeader>
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle className="text-base">{report.name}</CardTitle>
                  <CardDescription>
                     {formatDate(new Date(report.createdAt), "DD MMM YYYY")}
                  </CardDescription>
               </div>
               <ReportTypeBadge type={report.type} />
            </div>
         </CardHeader>
         <CardContent>
            {report.description && (
               <p className="text-sm text-muted-foreground line-clamp-2">
                  {report.description}
               </p>
            )}
         </CardContent>
         <CardFooter>
            <CollapsibleTrigger asChild>
               <Button
                  className="w-full"
                  onClick={(e) => {
                     e.stopPropagation();
                     toggleExpanded();
                  }}
                  variant="outline"
               >
                  {isExpanded ? "Menos Informações" : "Mais Informações"}
                  <ChevronDown
                     className={`size-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
               </Button>
            </CollapsibleTrigger>
         </CardFooter>
      </Card>
   );
}
