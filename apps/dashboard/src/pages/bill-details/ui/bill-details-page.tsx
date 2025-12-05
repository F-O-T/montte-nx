import { translate } from "@packages/localization";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDate } from "@packages/utils/date";
import {
   calculateInterest,
   type InterestConfig,
   type InterestRates,
} from "@packages/utils/interest";
import { formatDecimalCurrency } from "@packages/utils/money";
import {
   getRecurrenceLabel,
   type RecurrencePattern,
} from "@packages/utils/recurrence";
import {
   useMutation,
   useQuery,
   useQueryClient,
   useSuspenseQueries,
} from "@tanstack/react-query";
import { Link, useParams, useRouter } from "@tanstack/react-router";
import {
   AlertCircle,
   ArrowLeft,
   Building,
   Calendar,
   CalendarDays,
   CheckCircle2,
   Clock,
   Download,
   Edit,
   ExternalLink,
   FileText,
   Loader2,
   Paperclip,
   Percent,
   Receipt,
   Trash2,
   TrendingUp,
   Upload,
   User,
   Wallet,
} from "lucide-react";
import { type ChangeEvent, Suspense, useRef, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import type { IconName } from "@/features/icon-selector/lib/available-icons";
import { IconDisplay } from "@/features/icon-selector/ui/icon-display";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { CompleteBillDialog } from "@/pages/bills/features/complete-bill-dialog";
import { ManageBillSheet } from "@/pages/bills/features/manage-bill-sheet";
import { DeleteBillDialog } from "../features/delete-bill-dialog";

function BillDetailsContent() {
   const params = useParams({ strict: false });
   const billId = (params as { billId?: string }).billId ?? "";
   const trpc = useTRPC();
   const router = useRouter();
   const queryClient = useQueryClient();
   const { activeOrganization } = useActiveOrganization();
   const fileInputRef = useRef<HTMLInputElement>(null);

   const [isEditOpen, setIsEditOpen] = useState(false);
   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
   const [uploadingFile, setUploadingFile] = useState(false);
   const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
      string | null
   >(null);
   const [deletingAttachmentId, setDeletingAttachmentId] = useState<
      string | null
   >(null);

   const [billQuery, categoriesQuery] = useSuspenseQueries({
      queries: [
         trpc.bills.getById.queryOptions({ id: billId }),
         trpc.categories.getAll.queryOptions(),
      ],
   });

   const bill = billQuery.data;
   const categories = categoriesQuery.data ?? [];
   const category = categories.find((c) => c.id === bill.categoryId);

   const { data: attachments = [], refetch: refetchAttachments } = useQuery(
      trpc.bills.getAttachments.queryOptions({ billId }),
   );

   const { data: installmentBills = [] } = useQuery({
      ...trpc.bills.getByInstallmentGroup.queryOptions({
         installmentGroupId: bill?.installmentGroupId ?? "",
      }),
      enabled: !!bill?.installmentGroupId,
   });

   const addAttachmentMutation = useMutation(
      trpc.bills.addAttachment.mutationOptions({
         onError: () => {
            setUploadingFile(false);
         },
         onSuccess: () => {
            refetchAttachments();
            setUploadingFile(false);
         },
      }),
   );

   const deleteAttachmentMutation = useMutation(
      trpc.bills.deleteAttachment.mutationOptions({
         onError: () => {
            setDeletingAttachmentId(null);
         },
         onSuccess: () => {
            refetchAttachments();
            setDeletingAttachmentId(null);
         },
      }),
   );

   const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingFile(true);
      try {
         const buffer = await file.arrayBuffer();
         const base64 = btoa(
            new Uint8Array(buffer).reduce(
               (data, byte) => data + String.fromCharCode(byte),
               "",
            ),
         );

         await addAttachmentMutation.mutateAsync({
            billId,
            contentType: file.type,
            fileBuffer: base64,
            fileName: file.name,
            fileSize: file.size,
         });
      } catch {
         setUploadingFile(false);
      }

      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
   };

   const handleDownloadAttachment = async (attachmentId: string) => {
      setDownloadingAttachmentId(attachmentId);
      try {
         const data = await queryClient.fetchQuery(
            trpc.bills.getAttachmentData.queryOptions({
               attachmentId,
               billId,
            }),
         );
         if (data?.data) {
            const link = document.createElement("a");
            link.href = data.data;
            link.download = data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
         }
      } catch (error) {
         console.error("Error downloading attachment:", error);
      } finally {
         setDownloadingAttachmentId(null);
      }
   };

   const handleDeleteAttachment = async (attachmentId: string) => {
      setDeletingAttachmentId(attachmentId);
      try {
         await deleteAttachmentMutation.mutateAsync({
            attachmentId,
            billId,
         });
      } catch {
         setDeletingAttachmentId(null);
      }
   };

   if (!billId) {
      return (
         <BillDetailsPageError
            error={new Error("Invalid bill ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!bill) {
      return null;
   }

   const handleDeleteSuccess = () => {
      router.navigate({
         params: { slug: activeOrganization.slug },
         to: "/$slug/bills",
      });
   };

   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const isOverdue =
      bill.dueDate && !bill.completionDate && new Date(bill.dueDate) < today;
   const isCompleted = !!bill.completionDate;

   const getStatusInfo = () => {
      if (isCompleted) {
         return {
            className: "border-green-500 text-green-500",
            icon: CheckCircle2,
            label: translate("dashboard.routes.bills.status.paid"),
            variant: "outline" as const,
         };
      }
      if (isOverdue) {
         return {
            className: "",
            icon: AlertCircle,
            label: translate("dashboard.routes.bills.status.overdue"),
            variant: "destructive" as const,
         };
      }
      return {
         className: "",
         icon: Clock,
         label: translate("dashboard.routes.bills.status.pending"),
         variant: "secondary" as const,
      };
   };

   const status = getStatusInfo();
   const StatusIcon = status.icon;

   return (
      <main className="space-y-4">
         <DefaultHeader
            description={translate(
               "dashboard.routes.bills.details.description",
            )}
            title={bill.description}
         />

         <div className="flex flex-wrap items-center gap-2">
            {!isCompleted && (
               <>
                  <CompleteBillDialog bill={bill}>
                     <Button size="sm" variant="outline">
                        <Wallet className="size-4" />
                        {bill.type === "expense"
                           ? translate("dashboard.routes.bills.actions.pay")
                           : translate(
                                "dashboard.routes.bills.actions.receive",
                             )}
                     </Button>
                  </CompleteBillDialog>
                  <Button
                     onClick={() => setIsEditOpen(true)}
                     size="sm"
                     variant="outline"
                  >
                     <Edit className="size-4" />
                     {translate("dashboard.routes.bills.actions.edit")}
                  </Button>
               </>
            )}
            <Button
               className="text-destructive hover:text-destructive"
               onClick={() => setIsDeleteOpen(true)}
               size="sm"
               variant="outline"
            >
               <Trash2 className="size-4" />
               {translate("dashboard.routes.bills.actions.delete")}
            </Button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     {translate("dashboard.routes.bills.table.columns.amount")}
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center gap-2">
                     <Badge
                        variant={
                           bill.type === "expense" ? "destructive" : "default"
                        }
                     >
                        {bill.type === "expense" ? "-" : "+"}
                        {formatDecimalCurrency(Number(bill.amount))}
                     </Badge>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     {translate("dashboard.routes.bills.table.columns.status")}
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <Badge className={status.className} variant={status.variant}>
                     <StatusIcon className="size-3 mr-1" />
                     {status.label}
                  </Badge>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     {translate("dashboard.routes.bills.table.columns.dueDate")}
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center gap-2">
                     <Calendar className="size-4 text-muted-foreground" />
                     <span className="font-medium">
                        {formatDate(new Date(bill.dueDate), "DD/MM/YYYY")}
                     </span>
                  </div>
               </CardContent>
            </Card>

            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                     {translate(
                        "dashboard.routes.bills.features.create-bill.fields.category",
                     )}
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center gap-2">
                     <div
                        className="size-6 rounded flex items-center justify-center"
                        style={{
                           backgroundColor: category?.color || "#6b7280",
                        }}
                     >
                        <IconDisplay
                           iconName={(category?.icon || "Wallet") as IconName}
                           size={12}
                        />
                     </div>
                     <span className="font-medium">
                        {category?.name || "Sem categoria"}
                     </span>
                  </div>
               </CardContent>
            </Card>
         </div>

         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("dashboard.routes.bills.details.info.title")}
               </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bill.issueDate && (
                     <div className="flex items-center gap-3">
                        <FileText className="size-4 text-muted-foreground" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.fields.issueDate",
                              )}
                           </p>
                           <p className="text-sm font-medium">
                              {formatDate(
                                 new Date(bill.issueDate),
                                 "DD/MM/YYYY",
                              )}
                           </p>
                        </div>
                     </div>
                  )}

                  {bill.completionDate && (
                     <div className="flex items-center gap-3">
                        <CheckCircle2 className="size-4 text-green-500" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              {translate("dashboard.routes.bills.completedOn")}
                           </p>
                           <p className="text-sm font-medium">
                              {formatDate(
                                 new Date(bill.completionDate),
                                 "DD/MM/YYYY",
                              )}
                           </p>
                        </div>
                     </div>
                  )}

                  {bill.isRecurring && bill.recurrencePattern && (
                     <div className="flex items-center gap-3">
                        <CalendarDays className="size-4 text-muted-foreground" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              Recorrência
                           </p>
                           <p className="text-sm font-medium">
                              {getRecurrenceLabel(
                                 bill.recurrencePattern as RecurrencePattern,
                              )}
                           </p>
                        </div>
                     </div>
                  )}

                  {bill.bankAccount && (
                     <div className="flex items-center gap-3">
                        <Building className="size-4 text-muted-foreground" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.fields.bankAccount",
                              )}
                           </p>
                           <p className="text-sm font-medium">
                              {bill.bankAccount.name}
                           </p>
                        </div>
                     </div>
                  )}

                  {bill.counterparty && (
                     <div className="flex items-center gap-3">
                        <User className="size-4 text-muted-foreground" />
                        <div>
                           <p className="text-xs text-muted-foreground">
                              {translate(
                                 "dashboard.routes.bills.features.create-bill.fields.counterparty",
                              )}
                           </p>
                           <p className="text-sm font-medium">
                              {bill.counterparty?.name}
                           </p>
                        </div>
                     </div>
                  )}

                  <div className="flex items-center gap-3">
                     <Wallet className="size-4 text-muted-foreground" />
                     <div>
                        <p className="text-xs text-muted-foreground">
                           {translate(
                              "dashboard.routes.bills.table.columns.type",
                           )}
                        </p>
                        <p className="text-sm font-medium">
                           {bill.type === "expense"
                              ? translate("dashboard.routes.bills.type.payable")
                              : translate(
                                   "dashboard.routes.bills.type.receivable",
                                )}
                        </p>
                     </div>
                  </div>
               </div>

               {bill.notes && (
                  <>
                     <Separator />
                     <div>
                        <p className="text-xs text-muted-foreground mb-1">
                           {translate(
                              "dashboard.routes.bills.features.create-bill.fields.notes",
                           )}
                        </p>
                        <p className="text-sm">{bill.notes}</p>
                     </div>
                  </>
               )}
            </CardContent>
         </Card>

         {bill.transaction && (
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <Receipt className="size-5" />
                     {translate(
                        "dashboard.routes.bills.details.related-transaction.title",
                     )}
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                     <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                           <span className="font-medium">
                              {bill.transaction.description}
                           </span>
                           <span className="text-sm text-muted-foreground">
                              {formatDate(
                                 new Date(bill.transaction.date),
                                 "DD/MM/YYYY",
                              )}
                           </span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <Badge
                           variant={
                              bill.transaction.type === "expense"
                                 ? "destructive"
                                 : "default"
                           }
                        >
                           {bill.transaction.type === "expense" ? "-" : "+"}
                           {formatDecimalCurrency(
                              Number(bill.transaction.amount),
                           )}
                        </Badge>
                        <Button asChild size="sm" variant="outline">
                           <Link
                              params={{
                                 slug: activeOrganization.slug,
                                 transactionId: bill.transaction.id,
                              }}
                              to="/$slug/transactions/$transactionId"
                           >
                              <ExternalLink className="size-4" />
                              Ver transação
                           </Link>
                        </Button>
                     </div>
                  </div>
               </CardContent>
            </Card>
         )}

         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
               <CardTitle className="flex items-center gap-2">
                  <Paperclip className="size-5" />
                  {translate(
                     "dashboard.routes.bills.details.attachments.title",
                  )}{" "}
                  ({attachments.length})
               </CardTitle>
               <div>
                  <input
                     accept="*/*"
                     className="hidden"
                     onChange={handleFileUpload}
                     ref={fileInputRef}
                     type="file"
                  />
                  <Button
                     disabled={uploadingFile}
                     onClick={() => fileInputRef.current?.click()}
                     size="sm"
                     variant="outline"
                  >
                     {uploadingFile ? (
                        <>
                           <Loader2 className="size-4 animate-spin" />
                           {translate(
                              "dashboard.routes.bills.details.attachments.uploading",
                           )}
                        </>
                     ) : (
                        <>
                           <Upload className="size-4" />
                           {translate(
                              "dashboard.routes.bills.details.attachments.upload",
                           )}
                        </>
                     )}
                  </Button>
               </div>
            </CardHeader>
            <CardContent>
               {attachments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                     {translate(
                        "dashboard.routes.bills.details.attachments.empty",
                     )}
                  </p>
               ) : (
                  <div className="space-y-2">
                     {attachments.map((attachment) => (
                        <div
                           className="flex items-center justify-between p-3 border rounded-lg"
                           key={attachment.id}
                        >
                           <div className="flex items-center gap-3">
                              <FileText className="size-4 text-muted-foreground" />
                              <div>
                                 <p className="text-sm font-medium">
                                    {attachment.fileName}
                                 </p>
                                 {attachment.fileSize && (
                                    <p className="text-xs text-muted-foreground">
                                       {Math.round(attachment.fileSize / 1024)}{" "}
                                       KB
                                    </p>
                                 )}
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <Button
                                 disabled={
                                    downloadingAttachmentId === attachment.id
                                 }
                                 onClick={() =>
                                    handleDownloadAttachment(attachment.id)
                                 }
                                 size="sm"
                                 variant="ghost"
                              >
                                 {downloadingAttachmentId === attachment.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                 ) : (
                                    <Download className="size-4" />
                                 )}
                              </Button>
                              <Button
                                 disabled={
                                    deletingAttachmentId === attachment.id
                                 }
                                 onClick={() =>
                                    handleDeleteAttachment(attachment.id)
                                 }
                                 size="sm"
                                 variant="ghost"
                              >
                                 {deletingAttachmentId === attachment.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                 ) : (
                                    <Trash2 className="size-4 text-destructive" />
                                 )}
                              </Button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </CardContent>
         </Card>

         {bill.type === "income" &&
            isOverdue &&
            !isCompleted &&
            bill.interestTemplate && (
               <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="size-5" />
                        {translate(
                           "dashboard.routes.bills.details.interest.title",
                        )}
                     </CardTitle>
                  </CardHeader>
                  <CardContent>
                     {(() => {
                        const template = bill.interestTemplate;
                        const config: InterestConfig = {
                           gracePeriodDays: template.gracePeriodDays,
                           interestType: template.interestType as
                              | "none"
                              | "daily"
                              | "monthly",
                           interestValue: template.interestValue
                              ? Number(template.interestValue)
                              : null,
                           monetaryCorrectionIndex:
                              template.monetaryCorrectionIndex as
                                 | "none"
                                 | "ipca"
                                 | "selic"
                                 | "cdi",
                           penaltyType: template.penaltyType as
                              | "none"
                              | "percentage"
                              | "fixed",
                           penaltyValue: template.penaltyValue
                              ? Number(template.penaltyValue)
                              : null,
                        };

                        const rates: InterestRates = {
                           cdi: 13.15,
                           ipca: 4.5,
                           selic: 13.25,
                        };

                        const result = calculateInterest(
                           Number(bill.amount),
                           new Date(bill.dueDate),
                           config,
                           rates,
                        );

                        return (
                           <div className="space-y-4">
                              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                 <div className="flex items-center gap-2">
                                    <FileText className="size-4 text-muted-foreground" />
                                    <span className="text-sm">
                                       {translate(
                                          "dashboard.routes.bills.details.interest.template",
                                       )}
                                       :
                                    </span>
                                 </div>
                                 <Link
                                    className="text-sm font-medium text-primary hover:underline"
                                    params={{
                                       interestTemplateId: template.id,
                                       slug: activeOrganization.slug,
                                    }}
                                    to="/$slug/interest-templates/$interestTemplateId"
                                 >
                                    {template.name}
                                 </Link>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                    <span className="text-xs text-muted-foreground">
                                       {translate(
                                          "dashboard.routes.bills.details.interest.daysOverdue",
                                       )}
                                    </span>
                                    <span className="text-lg font-semibold text-destructive">
                                       {result.daysOverdue}
                                    </span>
                                 </div>

                                 <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                    <span className="text-xs text-muted-foreground">
                                       {translate(
                                          "dashboard.routes.bills.details.interest.originalAmount",
                                       )}
                                    </span>
                                    <span className="text-lg font-semibold">
                                       {formatDecimalCurrency(
                                          Number(bill.amount),
                                       )}
                                    </span>
                                 </div>

                                 {result.penaltyAmount > 0 && (
                                    <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                       <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Percent className="size-3" />
                                          {translate(
                                             "dashboard.routes.bills.details.interest.penalty",
                                          )}
                                       </span>
                                       <span className="text-lg font-semibold text-orange-500">
                                          +{" "}
                                          {formatDecimalCurrency(
                                             result.penaltyAmount,
                                          )}
                                       </span>
                                    </div>
                                 )}

                                 {result.interestAmount > 0 && (
                                    <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                       <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <TrendingUp className="size-3" />
                                          {translate(
                                             "dashboard.routes.bills.details.interest.interest",
                                          )}
                                       </span>
                                       <span className="text-lg font-semibold text-orange-500">
                                          +{" "}
                                          {formatDecimalCurrency(
                                             result.interestAmount,
                                          )}
                                       </span>
                                    </div>
                                 )}

                                 {result.correctionAmount > 0 && (
                                    <div className="flex flex-col gap-1 p-3 border rounded-lg">
                                       <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <TrendingUp className="size-3" />
                                          {translate(
                                             "dashboard.routes.bills.details.interest.correction",
                                          )}
                                       </span>
                                       <span className="text-lg font-semibold text-orange-500">
                                          +{" "}
                                          {formatDecimalCurrency(
                                             result.correctionAmount,
                                          )}
                                       </span>
                                    </div>
                                 )}
                              </div>

                              <Separator />

                              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                                 <span className="text-sm font-medium">
                                    {translate(
                                       "dashboard.routes.bills.details.interest.updatedAmount",
                                    )}
                                 </span>
                                 <span className="text-xl font-bold text-primary">
                                    {formatDecimalCurrency(
                                       result.updatedAmount,
                                    )}
                                 </span>
                              </div>
                           </div>
                        );
                     })()}
                  </CardContent>
               </Card>
            )}

         {bill.installmentGroupId && installmentBills.length > 0 && (
            <Card>
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <CalendarDays className="size-5" />
                     {translate(
                        "dashboard.routes.bills.details.installments.title",
                     )}{" "}
                     ({bill.installmentNumber}/{bill.totalInstallments})
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="space-y-2">
                     {installmentBills.slice(0, 5).map((installment) => {
                        const isCurrent = installment.id === bill.id;
                        const isPaid = !!installment.completionDate;

                        return (
                           <div
                              className={`flex items-center justify-between p-3 border rounded-lg ${isCurrent ? "border-primary bg-primary/5" : ""}`}
                              key={installment.id}
                           >
                              <div className="flex items-center gap-3">
                                 {isPaid ? (
                                    <CheckCircle2 className="size-4 text-green-500" />
                                 ) : isCurrent ? (
                                    <Clock className="size-4 text-primary" />
                                 ) : (
                                    <Clock className="size-4 text-muted-foreground" />
                                 )}
                                 <div>
                                    <p className="text-sm font-medium">
                                       Parcela {installment.installmentNumber}
                                       {isCurrent && (
                                          <Badge
                                             className="ml-2"
                                             variant="secondary"
                                          >
                                             {translate(
                                                "dashboard.routes.bills.details.installments.current",
                                             )}
                                          </Badge>
                                       )}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                       {formatDate(
                                          new Date(installment.dueDate),
                                          "DD/MM/YYYY",
                                       )}
                                    </p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <span className="text-sm font-medium">
                                    {formatDecimalCurrency(
                                       Number(installment.amount),
                                    )}
                                 </span>
                                 <Badge
                                    variant={isPaid ? "default" : "secondary"}
                                 >
                                    {isPaid
                                       ? translate(
                                            "dashboard.routes.bills.details.installments.paid",
                                         )
                                       : translate(
                                            "dashboard.routes.bills.details.installments.pending",
                                         )}
                                 </Badge>
                              </div>
                           </div>
                        );
                     })}
                     {installmentBills.length > 5 && (
                        <Button className="w-full" size="sm" variant="ghost">
                           {translate(
                              "dashboard.routes.bills.details.installments.viewAll",
                           )}
                        </Button>
                     )}
                  </div>
               </CardContent>
            </Card>
         )}

         <ManageBillSheet
            bill={bill}
            onOpen={isEditOpen}
            onOpenChange={setIsEditOpen}
         />
         <DeleteBillDialog
            bill={bill}
            onOpenChange={setIsDeleteOpen}
            onSuccess={handleDeleteSuccess}
            open={isDeleteOpen}
         />
      </main>
   );
}

function BillDetailsPageSkeleton() {
   return (
      <main className="space-y-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-72" />
         </div>
         <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
         </div>
         <Skeleton className="h-64 w-full" />
      </main>
   );
}

function BillDetailsPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Receipt className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate("dashboard.routes.bills.details.error.title")}
                  </EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/bills",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <ArrowLeft className="size-4 mr-2" />
                        {translate("dashboard.routes.bills.details.error.back")}
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        {translate(
                           "dashboard.routes.bills.details.error.retry",
                        )}
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function BillDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={BillDetailsPageError}>
         <Suspense fallback={<BillDetailsPageSkeleton />}>
            <BillDetailsContent />
         </Suspense>
      </ErrorBoundary>
   );
}
