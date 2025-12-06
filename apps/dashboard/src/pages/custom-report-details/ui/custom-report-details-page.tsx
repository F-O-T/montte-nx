import type { DRESnapshotData } from "@packages/database/repositories/custom-report-repository";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { DataTable } from "@packages/ui/components/data-table";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { StatsCard } from "@packages/ui/components/stats-card";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@packages/ui/components/table";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi, Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
   ArrowDownLeft,
   ArrowLeft,
   ArrowUpRight,
   BarChart3,
   Building2,
   Calculator,
   Download,
   Edit,
   Filter,
   FolderTree,
   Tag,
} from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { ManageCustomReportForm } from "@/features/custom-report/ui/manage-custom-report-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";
import { useExportPdf } from "@/pages/custom-reports/features/use-export-pdf";

const routeApi = getRouteApi("/$slug/_dashboard/custom-reports/$reportId");

type TransactionRow = {
   id: string;
   description: string;
   date: string;
   amount: number;
   type: "income" | "expense" | "transfer";
   categoryName?: string;
   bankAccountName?: string;
};

function CustomReportDetailsErrorFallback(props: FallbackProps) {
   return (
      <div className="space-y-4">
         {createErrorFallback({
            errorDescription:
               "Falha ao carregar relatório. Tente novamente mais tarde.",
            errorTitle: "Erro ao carregar relatório",
            retryText: "Tentar novamente",
         })(props)}
      </div>
   );
}

function CustomReportDetailsSkeleton() {
   return (
      <div className="space-y-6">
         <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
               <Skeleton className="h-6 w-48" />
               <Skeleton className="h-4 w-32" />
            </div>
         </div>
         <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
               <Card key={`stat-skeleton-${i + 1}`}>
                  <CardContent className="pt-6">
                     <Skeleton className="h-16 w-full" />
                  </CardContent>
               </Card>
            ))}
         </div>
         <Card>
            <CardHeader>
               <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
               <Skeleton className="h-64 w-full" />
            </CardContent>
         </Card>
      </div>
   );
}

function DRETable({
   snapshotData,
   type,
}: {
   snapshotData: DRESnapshotData;
   type: string;
}) {
   const isFiscal = type === "dre_fiscal";

   return (
      <Table>
         <TableHeader>
            <TableRow>
               <TableHead className="w-16">Código</TableHead>
               <TableHead>Descrição</TableHead>
               {isFiscal ? (
                  <>
                     <TableHead className="text-right">Planejado</TableHead>
                     <TableHead className="text-right">Realizado</TableHead>
                     <TableHead className="text-right">Variação</TableHead>
                  </>
               ) : (
                  <TableHead className="text-right">Valor</TableHead>
               )}
            </TableRow>
         </TableHeader>
         <TableBody>
            {snapshotData.dreLines.map((line) => (
               <TableRow
                  className={line.isTotal ? "bg-muted/50 font-medium" : ""}
                  key={line.code}
               >
                  <TableCell className="text-muted-foreground">
                     {line.code}
                  </TableCell>
                  <TableCell
                     style={{ paddingLeft: `${line.indent * 24 + 16}px` }}
                  >
                     {line.label}
                  </TableCell>
                  {isFiscal ? (
                     <>
                        <TableCell className="text-right">
                           {formatDecimalCurrency(line.plannedValue || 0)}
                        </TableCell>
                        <TableCell className="text-right">
                           {formatDecimalCurrency(line.value)}
                        </TableCell>
                        <TableCell
                           className={`text-right ${
                              (line.variance || 0) >= 0
                                 ? "text-emerald-600"
                                 : "text-destructive"
                           }`}
                        >
                           {(line.variance || 0) >= 0 ? "+" : ""}
                           {formatDecimalCurrency(line.variance || 0)}
                        </TableCell>
                     </>
                  ) : (
                     <TableCell
                        className={`text-right ${
                           line.value >= 0
                              ? "text-emerald-600"
                              : "text-destructive"
                        }`}
                     >
                        {formatDecimalCurrency(line.value)}
                     </TableCell>
                  )}
               </TableRow>
            ))}
         </TableBody>
      </Table>
   );
}

function FilterMetadataSection({
   snapshotData,
}: {
   snapshotData: DRESnapshotData;
}) {
   const filterMetadata = snapshotData.filterMetadata;
   if (!filterMetadata) {
      return null;
   }

   const hasFilters =
      (filterMetadata.bankAccounts && filterMetadata.bankAccounts.length > 0) ||
      (filterMetadata.categories && filterMetadata.categories.length > 0) ||
      (filterMetadata.costCenters && filterMetadata.costCenters.length > 0) ||
      (filterMetadata.tags && filterMetadata.tags.length > 0);

   if (!hasFilters) {
      return null;
   }

   return (
      <Card>
         <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
               <Filter className="size-4 text-muted-foreground" />
               <CardTitle className="text-base">Filtros Aplicados</CardTitle>
            </div>
         </CardHeader>
         <CardContent>
            <div className="flex flex-wrap gap-4">
               {filterMetadata.bankAccounts &&
                  filterMetadata.bankAccounts.length > 0 && (
                     <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                           <Building2 className="size-3" />
                           <span>Contas Bancárias</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                           {filterMetadata.bankAccounts.map((item) => (
                              <Badge key={item.id} variant="secondary">
                                 {item.name}
                              </Badge>
                           ))}
                        </div>
                     </div>
                  )}
               {filterMetadata.categories &&
                  filterMetadata.categories.length > 0 && (
                     <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                           <FolderTree className="size-3" />
                           <span>Categorias</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                           {filterMetadata.categories.map((item) => (
                              <Badge key={item.id} variant="secondary">
                                 {item.name}
                              </Badge>
                           ))}
                        </div>
                     </div>
                  )}
               {filterMetadata.costCenters &&
                  filterMetadata.costCenters.length > 0 && (
                     <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                           <Building2 className="size-3" />
                           <span>Centros de Custo</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                           {filterMetadata.costCenters.map((item) => (
                              <Badge key={item.id} variant="secondary">
                                 {item.name}
                              </Badge>
                           ))}
                        </div>
                     </div>
                  )}
               {filterMetadata.tags && filterMetadata.tags.length > 0 && (
                  <div className="space-y-1">
                     <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Tag className="size-3" />
                        <span>Tags</span>
                     </div>
                     <div className="flex flex-wrap gap-1">
                        {filterMetadata.tags.map((item) => (
                           <Badge key={item.id} variant="secondary">
                              {item.name}
                           </Badge>
                        ))}
                     </div>
                  </div>
               )}
            </div>
         </CardContent>
      </Card>
   );
}

function CategoryBreakdownSection({
   snapshotData,
}: {
   snapshotData: DRESnapshotData;
}) {
   if (!snapshotData.categoryBreakdown?.length) {
      return null;
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>Breakdown por Categoria</CardTitle>
            <CardDescription>
               Distribuição de receitas e despesas por categoria
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="space-y-3">
               {snapshotData.categoryBreakdown.map((cat) => (
                  <div
                     className="flex items-center justify-between p-3 rounded-lg border"
                     key={cat.categoryId}
                  >
                     <div className="flex items-center gap-3">
                        <div
                           className="w-3 h-3 rounded-full"
                           style={{ backgroundColor: cat.categoryColor }}
                        />
                        <span className="font-medium">{cat.categoryName}</span>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="text-right">
                           <p className="text-xs text-muted-foreground">
                              Receitas
                           </p>
                           <p className="text-sm font-medium text-emerald-600">
                              +{formatDecimalCurrency(cat.income)}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs text-muted-foreground">
                              Despesas
                           </p>
                           <p className="text-sm font-medium text-destructive">
                              -{formatDecimalCurrency(cat.expenses)}
                           </p>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         </CardContent>
      </Card>
   );
}

function TransactionsSection({
   snapshotData,
}: {
   snapshotData: DRESnapshotData;
}) {
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSize, setPageSize] = useState(20);

   const transactions = snapshotData.transactions || [];

   const columns: ColumnDef<TransactionRow>[] = useMemo(
      () => [
         {
            accessorKey: "date",
            cell: ({ row }) =>
               formatDate(new Date(row.original.date), "DD/MM/YYYY"),
            header: "Data",
         },
         {
            accessorKey: "description",
            header: "Descrição",
         },
         {
            accessorKey: "categoryName",
            cell: ({ row }) => row.original.categoryName || "-",
            header: "Categoria",
         },
         {
            accessorKey: "type",
            cell: ({ row }) => {
               const type = row.original.type;
               const typeConfig = {
                  expense: {
                     icon: <ArrowUpRight className="size-4 text-destructive" />,
                     label: "Despesa",
                  },
                  income: {
                     icon: (
                        <ArrowDownLeft className="size-4 text-emerald-500" />
                     ),
                     label: "Receita",
                  },
                  transfer: {
                     icon: <ArrowUpRight className="size-4 text-blue-500" />,
                     label: "Transferência",
                  },
               };
               const config = typeConfig[type];
               return (
                  <div className="flex items-center gap-1">
                     {config.icon}
                     <span className="text-xs">{config.label}</span>
                  </div>
               );
            },
            header: "Tipo",
         },
         {
            accessorKey: "amount",
            cell: ({ row }) => {
               const type = row.original.type;
               const colorClass =
                  type === "income"
                     ? "text-emerald-600"
                     : type === "transfer"
                       ? "text-blue-600"
                       : "text-destructive";
               const prefix = type === "income" ? "+" : "-";
               return (
                  <span className={colorClass}>
                     {prefix}
                     {formatDecimalCurrency(row.original.amount)}
                  </span>
               );
            },
            header: () => <div className="text-right">Valor</div>,
         },
      ],
      [],
   );

   const paginatedData = useMemo(() => {
      const startIndex = (currentPage - 1) * pageSize;
      return transactions.slice(startIndex, startIndex + pageSize);
   }, [transactions, currentPage, pageSize]);

   const totalPages = Math.ceil(transactions.length / pageSize);

   if (!transactions.length) {
      return null;
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>Transações do Período</CardTitle>
            <CardDescription>
               {transactions.length} transações incluídas neste relatório
            </CardDescription>
         </CardHeader>
         <CardContent>
            <DataTable
               columns={columns}
               data={paginatedData}
               getRowId={(row) => row.id}
               pagination={{
                  currentPage,
                  onPageChange: setCurrentPage,
                  onPageSizeChange: setPageSize,
                  pageSize,
                  totalCount: transactions.length,
                  totalPages,
               }}
            />
         </CardContent>
      </Card>
   );
}

function CustomReportDetailsContent() {
   const { reportId } = routeApi.useParams();
   const { activeOrganization } = useActiveOrganization();
   const { openSheet } = useSheet();
   const { exportPdf, isExporting } = useExportPdf();
   const trpc = useTRPC();

   const { data: report } = useSuspenseQuery(
      trpc.customReports.getById.queryOptions({ id: reportId }),
   );

   const snapshotData = report.snapshotData as DRESnapshotData;

   const periodLabel = `${formatDate(new Date(report.startDate), "DD/MM/YYYY")} - ${formatDate(new Date(report.endDate), "DD/MM/YYYY")}`;

   return (
      <div className="space-y-6">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
               <Button asChild size="icon" variant="outline">
                  <Link
                     params={{ slug: activeOrganization.slug }}
                     to="/$slug/custom-reports"
                  >
                     <ArrowLeft className="size-4" />
                  </Link>
               </Button>
               <div>
                  <div className="flex items-center gap-2">
                     <h1 className="text-2xl font-bold">{report.name}</h1>
                     <Badge
                        variant={
                           report.type === "dre_gerencial"
                              ? "outline"
                              : "secondary"
                        }
                     >
                        {report.type === "dre_gerencial" ? (
                           <>
                              <BarChart3 className="size-3 mr-1" />
                              DRE Gerencial
                           </>
                        ) : (
                           <>
                              <Calculator className="size-3 mr-1" />
                              DRE Fiscal
                           </>
                        )}
                     </Badge>
                  </div>
                  {report.description && (
                     <p className="text-muted-foreground">
                        {report.description}
                     </p>
                  )}
               </div>
            </div>
            <div className="flex items-center gap-2">
               <Button
                  disabled={isExporting}
                  onClick={() => exportPdf(report.id)}
                  variant="outline"
               >
                  <Download className="size-4" />
                  Exportar PDF
               </Button>
               <Button
                  onClick={() =>
                     openSheet({
                        children: <ManageCustomReportForm report={report} />,
                     })
                  }
                  variant="outline"
               >
                  <Edit className="size-4" />
                  Editar
               </Button>
            </div>
         </div>

         <div className="grid gap-4 md:grid-cols-4">
            <StatsCard
               description={`Gerado em ${formatDate(new Date(snapshotData.generatedAt), "DD/MM/YYYY")}`}
               title="Período"
               value={periodLabel}
            />
            <StatsCard
               description={`${snapshotData.transactions?.length || 0} transações`}
               title="Total Receitas"
               value={`+${formatDecimalCurrency(snapshotData.summary.totalIncome)}`}
            />
            <StatsCard
               description="Despesas do período"
               title="Total Despesas"
               value={`-${formatDecimalCurrency(snapshotData.summary.totalExpenses)}`}
            />
            <StatsCard
               description={
                  snapshotData.summary.netResult >= 0 ? "Lucro" : "Prejuízo"
               }
               title="Resultado Líquido"
               value={`${snapshotData.summary.netResult >= 0 ? "+" : ""}${formatDecimalCurrency(snapshotData.summary.netResult)}`}
            />
         </div>

         <FilterMetadataSection snapshotData={snapshotData} />

         <Card>
            <CardHeader>
               <CardTitle>
                  DRE - Demonstração do Resultado do Exercício
               </CardTitle>
               <CardDescription>
                  Gerado em{" "}
                  {formatDate(
                     new Date(snapshotData.generatedAt),
                     "DD/MM/YYYY [às] HH:mm",
                  )}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <DRETable snapshotData={snapshotData} type={report.type} />
            </CardContent>
         </Card>

         <CategoryBreakdownSection snapshotData={snapshotData} />

         <TransactionsSection snapshotData={snapshotData} />
      </div>
   );
}

export function CustomReportDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={CustomReportDetailsErrorFallback}>
         <Suspense fallback={<CustomReportDetailsSkeleton />}>
            <CustomReportDetailsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
