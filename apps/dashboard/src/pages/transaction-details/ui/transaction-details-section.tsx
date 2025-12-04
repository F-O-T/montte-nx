import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@packages/ui/components/select";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatFileSize } from "@packages/utils/file";
import { formatDecimalCurrency } from "@packages/utils/money";
import {
   useMutation,
   useQuery,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
   ArrowRight,
   Building,
   ExternalLink,
   FileText,
   ImageIcon,
   Link2,
   Loader2,
   Paperclip,
   SendHorizontal,
} from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function DetailsErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>
            Falha ao carregar detalhes da transação
         </AlertDescription>
      </Alert>
   );
}

function DetailsSkeleton() {
   return (
      <div className="space-y-4">
         <Card>
            <CardHeader>
               <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
               <Skeleton className="h-20 w-full" />
            </CardContent>
         </Card>
      </div>
   );
}

function DetailsContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { activeOrganization } = useActiveOrganization();
   const slug = activeOrganization.slug;
   const [loadingAttachmentId, setLoadingAttachmentId] = useState<
      string | null
   >(null);
   const [selectedBankAccountId, setSelectedBankAccountId] =
      useState<string>("");

   const { data } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   const { data: attachments } = useQuery({
      ...trpc.transactions.getAttachments.queryOptions({
         transactionId: transactionId,
      }),
   });

   const { data: transferLog } = useQuery({
      ...trpc.transactions.getTransferLog.queryOptions({
         transactionId: transactionId,
      }),
      enabled: data.type === "transfer",
   });

   const { data: bankAccounts = [] } = useQuery({
      ...trpc.bankAccounts.getAll.queryOptions(),
      enabled: data.type === "transfer" && !transferLog,
   });

   const linkTransferMutation = useMutation(
      trpc.transactions.completeTransferLink.mutationOptions({
         onError: (error) => {
            toast.error(error.message || "Falha ao vincular transferência");
         },
         onSuccess: () => {
            toast.success("Transferência vinculada com sucesso");
            setSelectedBankAccountId("");
         },
      }),
   );

   const isTransfer = data.type === "transfer";
   const hasAttachments = attachments && attachments.length > 0;
   const isNegative = parseFloat(data.amount) < 0;
   const hasTransferLog = !!transferLog;
   const hasAnyDetails = hasAttachments || isTransfer;

   const availableBankAccounts = bankAccounts.filter(
      (account) => account.id !== data.bankAccountId,
   );

   const handleLinkTransfer = () => {
      if (!selectedBankAccountId || !data.bankAccountId) return;

      linkTransferMutation.mutate({
         otherBankAccountId: selectedBankAccountId,
         transactionId: transactionId,
      });
   };

   const handleViewAttachment = async (attachmentId: string) => {
      setLoadingAttachmentId(attachmentId);
      try {
         const attachmentData = await queryClient.fetchQuery(
            trpc.transactions.getAttachmentData.queryOptions({
               attachmentId,
               transactionId,
            }),
         );
         if (attachmentData?.data) {
            window.open(attachmentData.data, "_blank");
         }
      } finally {
         setLoadingAttachmentId(null);
      }
   };

   if (!hasAnyDetails) {
      return null;
   }

   const isOutgoing =
      hasTransferLog && transferLog.fromTransactionId === transactionId;

   return (
      <div className="space-y-4">
         {isTransfer && (
            <Card>
               <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                     <SendHorizontal className="size-4" />
                     Transferência
                     <Badge
                        className="text-xs"
                        variant={isNegative ? "destructive" : "default"}
                     >
                        {isNegative ? "Saída" : "Entrada"}
                     </Badge>
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  {hasTransferLog ? (
                     <>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                           <Link
                              className="flex-1"
                              params={{
                                 bankAccountId: transferLog.fromBankAccountId,
                                 slug,
                              }}
                              to="/$slug/bank-accounts/$bankAccountId"
                           >
                              <Item
                                 className={`h-full rounded-lg border transition-colors hover:bg-accent/50 ${
                                    isOutgoing
                                       ? "bg-destructive/5 border-destructive/20"
                                       : "bg-muted/30"
                                 }`}
                                 size="sm"
                                 variant="default"
                              >
                                 <ItemMedia
                                    className="size-10 rounded-md bg-background border"
                                    variant="icon"
                                 >
                                    <Building className="size-4" />
                                 </ItemMedia>
                                 <ItemContent>
                                    <ItemDescription className="text-[10px] uppercase tracking-wide">
                                       Origem
                                    </ItemDescription>
                                    <ItemTitle className="text-sm">
                                       {transferLog.fromBankAccount?.name ||
                                          "Conta de origem"}
                                    </ItemTitle>
                                    <ItemDescription className="text-xs">
                                       {transferLog.fromBankAccount?.bank}
                                    </ItemDescription>
                                 </ItemContent>
                              </Item>
                           </Link>

                           <div className="flex items-center justify-center">
                              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                                 <ArrowRight className="size-4 text-muted-foreground" />
                              </div>
                           </div>

                           <Link
                              className="flex-1"
                              params={{
                                 bankAccountId: transferLog.toBankAccountId,
                                 slug,
                              }}
                              to="/$slug/bank-accounts/$bankAccountId"
                           >
                              <Item
                                 className={`h-full rounded-lg border transition-colors hover:bg-accent/50 ${
                                    !isOutgoing
                                       ? "bg-primary/5 border-primary/20"
                                       : "bg-muted/30"
                                 }`}
                                 size="sm"
                                 variant="default"
                              >
                                 <ItemMedia
                                    className="size-10 rounded-md bg-background border"
                                    variant="icon"
                                 >
                                    <Building className="size-4" />
                                 </ItemMedia>
                                 <ItemContent>
                                    <ItemDescription className="text-[10px] uppercase tracking-wide">
                                       Destino
                                    </ItemDescription>
                                    <ItemTitle className="text-sm">
                                       {transferLog.toBankAccount?.name ||
                                          "Conta de destino"}
                                    </ItemTitle>
                                    <ItemDescription className="text-xs">
                                       {transferLog.toBankAccount?.bank}
                                    </ItemDescription>
                                 </ItemContent>
                              </Item>
                           </Link>
                        </div>

                        {transferLog.notes && (
                           <div className="rounded-lg bg-muted/30 border px-3 py-2">
                              <p className="text-xs text-muted-foreground mb-1">
                                 Observações
                              </p>
                              <p className="text-sm">{transferLog.notes}</p>
                           </div>
                        )}

                        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                           <span className="text-sm text-muted-foreground">
                              Valor transferido
                           </span>
                           <span className="font-semibold tabular-nums">
                              {formatDecimalCurrency(
                                 Math.abs(parseFloat(data.amount)),
                              )}
                           </span>
                        </div>
                     </>
                  ) : (
                     <>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                           {isNegative ? (
                              <Link
                                 className="flex-1"
                                 params={{
                                    bankAccountId: data.bankAccountId || "",
                                    slug,
                                 }}
                                 to="/$slug/bank-accounts/$bankAccountId"
                              >
                                 <Item
                                    className="h-full rounded-lg border transition-colors hover:bg-accent/50 bg-destructive/5 border-destructive/20"
                                    size="sm"
                                    variant="default"
                                 >
                                    <ItemMedia
                                       className="size-10 rounded-md bg-background border"
                                       variant="icon"
                                    >
                                       <Building className="size-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                       <ItemDescription className="text-[10px] uppercase tracking-wide">
                                          Origem
                                       </ItemDescription>
                                       <ItemTitle className="text-sm">
                                          {data.bankAccount?.name ||
                                             "Conta de origem"}
                                       </ItemTitle>
                                       <ItemDescription className="text-xs">
                                          {data.bankAccount?.bank}
                                       </ItemDescription>
                                    </ItemContent>
                                 </Item>
                              </Link>
                           ) : (
                              <div className="flex-1 rounded-lg border p-3 bg-muted/30">
                                 <p className="text-xs text-muted-foreground mb-2">
                                    Origem
                                 </p>
                                 <Select
                                    onValueChange={setSelectedBankAccountId}
                                    value={selectedBankAccountId}
                                 >
                                    <SelectTrigger>
                                       <SelectValue
                                          placeholder={translate(
                                             "common.form.from-account.placeholder",
                                          )}
                                       />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {availableBankAccounts.map((account) => (
                                          <SelectItem
                                             key={account.id}
                                             value={account.id}
                                          >
                                             {account.name} - {account.bank}
                                          </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </div>
                           )}

                           <div className="flex items-center justify-center">
                              <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                                 <ArrowRight className="size-4 text-muted-foreground" />
                              </div>
                           </div>

                           {!isNegative ? (
                              <Link
                                 className="flex-1"
                                 params={{
                                    bankAccountId: data.bankAccountId || "",
                                    slug,
                                 }}
                                 to="/$slug/bank-accounts/$bankAccountId"
                              >
                                 <Item
                                    className="h-full rounded-lg border transition-colors hover:bg-accent/50 bg-primary/5 border-primary/20"
                                    size="sm"
                                    variant="default"
                                 >
                                    <ItemMedia
                                       className="size-10 rounded-md bg-background border"
                                       variant="icon"
                                    >
                                       <Building className="size-4" />
                                    </ItemMedia>
                                    <ItemContent>
                                       <ItemDescription className="text-[10px] uppercase tracking-wide">
                                          Destino
                                       </ItemDescription>
                                       <ItemTitle className="text-sm">
                                          {data.bankAccount?.name ||
                                             "Conta de destino"}
                                       </ItemTitle>
                                       <ItemDescription className="text-xs">
                                          {data.bankAccount?.bank}
                                       </ItemDescription>
                                    </ItemContent>
                                 </Item>
                              </Link>
                           ) : (
                              <div className="flex-1 rounded-lg border p-3 bg-muted/30">
                                 <p className="text-xs text-muted-foreground mb-2">
                                    Destino
                                 </p>
                                 <Select
                                    onValueChange={setSelectedBankAccountId}
                                    value={selectedBankAccountId}
                                 >
                                    <SelectTrigger>
                                       <SelectValue
                                          placeholder={translate(
                                             "common.form.to-account.placeholder",
                                          )}
                                       />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {availableBankAccounts.map((account) => (
                                          <SelectItem
                                             key={account.id}
                                             value={account.id}
                                          >
                                             {account.name} - {account.bank}
                                          </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </div>
                           )}
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                           <span className="text-sm text-muted-foreground">
                              Valor transferido
                           </span>
                           <span className="font-semibold tabular-nums">
                              {formatDecimalCurrency(
                                 Math.abs(parseFloat(data.amount)),
                              )}
                           </span>
                        </div>

                        {selectedBankAccountId && (
                           <Button
                              className="w-full"
                              disabled={linkTransferMutation.isPending}
                              onClick={handleLinkTransfer}
                           >
                              {linkTransferMutation.isPending ? (
                                 <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Vinculando...
                                 </>
                              ) : (
                                 <>
                                    <Link2 className="size-4" />
                                    Vincular conta{" "}
                                    {isNegative ? "destino" : "origem"}
                                 </>
                              )}
                           </Button>
                        )}
                     </>
                  )}
               </CardContent>
            </Card>
         )}

         {hasAttachments && (
            <Card>
               <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                     <Paperclip className="size-4" />
                     Anexos ({attachments.length})
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <ItemGroup className="rounded-lg border">
                     {attachments.map((attachment, index) => {
                        const isPdf =
                           attachment.contentType === "application/pdf";
                        const isLoading = loadingAttachmentId === attachment.id;

                        return (
                           <div key={attachment.id}>
                              {index > 0 && <ItemSeparator />}
                              <Item size="sm" variant="default">
                                 <ItemMedia
                                    className={`size-10 rounded-md ${
                                       isPdf
                                          ? "bg-red-100 text-red-600"
                                          : "bg-blue-100 text-blue-600"
                                    }`}
                                    variant="icon"
                                 >
                                    {isPdf ? (
                                       <FileText className="size-5" />
                                    ) : (
                                       <ImageIcon className="size-5" />
                                    )}
                                 </ItemMedia>
                                 <ItemContent>
                                    <ItemTitle className="text-sm truncate max-w-[200px]">
                                       {attachment.fileName}
                                    </ItemTitle>
                                    <ItemDescription className="text-xs">
                                       {attachment.fileSize
                                          ? formatFileSize(attachment.fileSize)
                                          : isPdf
                                            ? "PDF"
                                            : "Imagem"}
                                    </ItemDescription>
                                 </ItemContent>
                                 <ItemActions>
                                    <Button
                                       disabled={isLoading}
                                       onClick={() =>
                                          handleViewAttachment(attachment.id)
                                       }
                                       size="sm"
                                       variant="outline"
                                    >
                                       {isLoading ? (
                                          <Loader2 className="size-4 animate-spin" />
                                       ) : (
                                          <>
                                             <ExternalLink className="size-4" />
                                             Abrir
                                          </>
                                       )}
                                    </Button>
                                 </ItemActions>
                              </Item>
                           </div>
                        );
                     })}
                  </ItemGroup>
               </CardContent>
            </Card>
         )}
      </div>
   );
}

export function TransactionDetailsSection({
   transactionId,
}: {
   transactionId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={DetailsErrorFallback}>
         <Suspense fallback={<DetailsSkeleton />}>
            <DetailsContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
