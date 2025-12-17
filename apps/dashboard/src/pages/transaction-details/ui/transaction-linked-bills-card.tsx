import { Alert, AlertDescription } from "@packages/ui/components/alert";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { formatDate } from "@packages/utils/date";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
   CalendarClock,
   CheckCircle2,
   Clock,
   ExternalLink,
   Landmark,
   Receipt,
   XCircle,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function LinkedBillsCardErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Falha ao carregar conta vinculada</AlertDescription>
      </Alert>
   );
}

function LinkedBillsCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
         </CardHeader>
         <CardContent>
            <Skeleton className="h-20 w-full" />
         </CardContent>
      </Card>
   );
}

type BillStatus = "paid" | "pending" | "overdue";

function getBillStatus(bill: {
   completionDate: Date | null;
   dueDate: Date;
}): BillStatus {
   if (bill.completionDate) {
      return "paid";
   }
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const dueDate = new Date(bill.dueDate);
   dueDate.setHours(0, 0, 0, 0);
   return dueDate < today ? "overdue" : "pending";
}

function getStatusConfig(status: BillStatus) {
   switch (status) {
      case "paid":
         return {
            color: "text-green-600",
            icon: CheckCircle2,
            label: "Pago",
            variant: "default" as const,
         };
      case "pending":
         return {
            color: "text-yellow-600",
            icon: Clock,
            label: "Pendente",
            variant: "secondary" as const,
         };
      case "overdue":
         return {
            color: "text-red-600",
            icon: XCircle,
            label: "Vencido",
            variant: "destructive" as const,
         };
   }
}

function LinkedBillsCardContent({ transactionId }: { transactionId: string }) {
   const trpc = useTRPC();
   const params = useParams({ strict: false });
   const slug = (params as { slug?: string }).slug ?? "";

   const { data: bill } = useQuery({
      ...trpc.bills.getByTransactionId.queryOptions({ transactionId }),
   });

   if (!bill) {
      return (
         <Card className="flex-1 flex flex-col">
            <CardHeader>
               <CardTitle>Conta Vinculada</CardTitle>
               <CardDescription>
                  Vincule esta transação a uma conta
               </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
               <p className="text-muted-foreground text-sm text-center">
                  Nenhuma conta vinculada a esta transação.
               </p>
            </CardContent>
         </Card>
      );
   }

   const status = getBillStatus(bill);
   const statusConfig = getStatusConfig(status);
   const StatusIcon = statusConfig.icon;
   const amount = Number.parseFloat(bill.amount);
   const formattedAmount = formatDecimalCurrency(Math.abs(amount));
   const isExpense = bill.type === "expense";

   return (
      <Card className="flex-1 flex flex-col">
         <CardHeader>
            <CardTitle>Conta Vinculada</CardTitle>
            <CardDescription>
               Esta transação está vinculada a uma conta
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Link
               className="block"
               params={{
                  slug,
                  billId: bill.id,
               }}
               to="/$slug/bills/$billId"
            >
               <Item
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  variant="outline"
               >
                  <ItemMedia
                     className={isExpense ? "bg-red-50" : "bg-green-50"}
                     style={{ color: isExpense ? "#ef4444" : "#10b981" }}
                     variant="icon"
                  >
                     <Receipt className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle className="truncate max-w-[200px]">
                        {bill.description}
                     </ItemTitle>
                     <ItemDescription className="flex items-center gap-2 flex-wrap">
                        {bill.dueDate && (
                           <span className="flex items-center gap-1">
                              <CalendarClock className="size-3" />
                              {formatDate(new Date(bill.dueDate), "DD/MM/YYYY")}
                           </span>
                        )}
                        {bill.bankAccount && (
                           <span className="flex items-center gap-1">
                              <Landmark className="size-3" />
                              {bill.bankAccount.name}
                           </span>
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions className="flex items-center gap-2">
                     <Badge variant={statusConfig.variant}>
                        <StatusIcon className="size-3 mr-1" />
                        {statusConfig.label}
                     </Badge>
                     <Badge variant={isExpense ? "destructive" : "default"}>
                        {isExpense ? "-" : "+"}
                        {formattedAmount}
                     </Badge>
                     <Button size="icon" variant="ghost">
                        <ExternalLink className="size-4" />
                     </Button>
                  </ItemActions>
               </Item>
            </Link>

            {bill.counterparty && (
               <div className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium">Fornecedor: </span>
                  {bill.counterparty.name}
               </div>
            )}

            {bill.installmentGroupId && bill.installmentNumber && (
               <div className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium">Parcela: </span>
                  {bill.installmentNumber}/{bill.totalInstallments}
               </div>
            )}

            {bill.notes && (
               <div className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium">Observações: </span>
                  {bill.notes}
               </div>
            )}
         </CardContent>
      </Card>
   );
}

export function TransactionLinkedBillsCard({
   transactionId,
}: {
   transactionId: string;
}) {
   return (
      <ErrorBoundary FallbackComponent={LinkedBillsCardErrorFallback}>
         <Suspense fallback={<LinkedBillsCardSkeleton />}>
            <LinkedBillsCardContent transactionId={transactionId} />
         </Suspense>
      </ErrorBoundary>
   );
}
