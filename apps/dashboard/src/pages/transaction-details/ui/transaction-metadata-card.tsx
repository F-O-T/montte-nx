import { Alert, AlertDescription } from "@packages/ui/components/alert";
import {
   Announcement,
   AnnouncementTag,
   AnnouncementTitle,
} from "@packages/ui/components/announcement";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { TRANSACTION_TYPE_CONFIG } from "@/features/transaction/lib/transaction-type-config";
import { BankAccountAnnouncement } from "@/features/transaction/ui/bank-account-announcement";
import { useTRPC } from "@/integrations/clients";

function MetadataCardErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Falha ao carregar metadados</AlertDescription>
      </Alert>
   );
}

function MetadataCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
         </CardHeader>
         <CardContent className="space-y-3">
            <Skeleton className="h-7 w-full rounded-full" />
            <Skeleton className="h-7 w-full rounded-full" />
            <Skeleton className="h-7 w-full rounded-full" />
         </CardContent>
      </Card>
   );
}

function MetadataCardContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();

   const { data: transaction } = useSuspenseQuery(
      trpc.transactions.getById.queryOptions({ id: transactionId }),
   );

   const amount = parseFloat(transaction.amount);
   const isPositive =
      transaction.type === "income" ||
      (transaction.type === "transfer" && amount > 0);
   const formattedAmount = formatDecimalCurrency(Math.abs(amount));
   const createdAt = formatDate(new Date(transaction.createdAt), "DD/MM/YYYY");

   const typeConfig =
      TRANSACTION_TYPE_CONFIG[
         transaction.type as keyof typeof TRANSACTION_TYPE_CONFIG
      ] || TRANSACTION_TYPE_CONFIG.expense;
   const TypeIcon = typeConfig.icon;

   return (
      <Card className="h-fit">
         <CardHeader>
            <CardTitle>Metadados</CardTitle>
            <CardDescription>Informações da transação</CardDescription>
         </CardHeader>
         <CardContent>
            <div className="flex flex-wrap gap-2">
               <Announcement>
                  <AnnouncementTag>Valor</AnnouncementTag>
                  <AnnouncementTitle
                     className={
                        isPositive ? "text-green-600" : "text-destructive"
                     }
                  >
                     {isPositive ? "+" : "-"}
                     {formattedAmount}
                  </AnnouncementTitle>
               </Announcement>

               <Announcement>
                  <AnnouncementTag
                     className="flex items-center gap-1.5"
                     style={{ color: typeConfig.color }}
                  >
                     <TypeIcon className="size-3.5" />
                     Tipo
                  </AnnouncementTag>
                  <AnnouncementTitle>{typeConfig.label}</AnnouncementTitle>
               </Announcement>

               {transaction.bankAccount && (
                  <BankAccountAnnouncement
                     bankAccount={transaction.bankAccount}
                     showLabel={false}
                  />
               )}

               <Announcement>
                  <AnnouncementTag>Registrado em</AnnouncementTag>
                  <AnnouncementTitle>{createdAt}</AnnouncementTitle>
               </Announcement>
            </div>
         </CardContent>
      </Card>
   );
}

export function TransactionMetadataCard({
   transactionId,
}: {
   transactionId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={MetadataCardErrorFallback}>
         <Suspense fallback={<MetadataCardSkeleton />}>
            <MetadataCardContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
