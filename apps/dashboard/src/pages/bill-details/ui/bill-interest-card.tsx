import { translate } from "@packages/localization";
import { Alert, AlertDescription } from "@packages/ui/components/alert";
import {
   Card,
   CardContent,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { Separator } from "@packages/ui/components/separator";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   calculateInterest,
   type InterestConfig,
   type InterestRates,
} from "@packages/utils/interest";
import { formatDecimalCurrency } from "@packages/utils/money";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText, Percent, TrendingUp } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function InterestCardErrorFallback() {
   return (
      <Alert variant="destructive">
         <AlertDescription>Falha ao carregar cálculo de juros</AlertDescription>
      </Alert>
   );
}

function InterestCardSkeleton() {
   return (
      <Card>
         <CardHeader>
            <Skeleton className="h-6 w-40" />
         </CardHeader>
         <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                     className="h-20 w-full rounded-lg"
                     key={`interest-skeleton-${i + 1}`}
                  />
               ))}
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
         </CardContent>
      </Card>
   );
}

function InterestCardContent({ billId }: { billId: string }) {
   const trpc = useTRPC();
   const { activeOrganization } = useActiveOrganization();

   const { data: bill } = useSuspenseQuery(
      trpc.bills.getById.queryOptions({ id: billId }),
   );

   // Calculate status
   const today = new Date();
   today.setHours(0, 0, 0, 0);
   const isCompleted = !!bill.completionDate;
   const isOverdue =
      bill.dueDate && !bill.completionDate && new Date(bill.dueDate) < today;

   // Only show for overdue income bills with interest template
   if (
      bill.type !== "income" ||
      !isOverdue ||
      isCompleted ||
      !bill.interestTemplate
   ) {
      return null;
   }

   const template = bill.interestTemplate;
   const config: InterestConfig = {
      gracePeriodDays: template.gracePeriodDays,
      interestType: template.interestType as "none" | "daily" | "monthly",
      interestValue: template.interestValue
         ? Number(template.interestValue)
         : null,
      monetaryCorrectionIndex: template.monetaryCorrectionIndex as
         | "none"
         | "ipca"
         | "selic"
         | "cdi",
      penaltyType: template.penaltyType as "none" | "percentage" | "fixed",
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
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <TrendingUp className="size-5" />
               {translate("dashboard.routes.bills.details.interest.title")}
            </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
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
                     {formatDecimalCurrency(Number(bill.amount))}
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
                        + {formatDecimalCurrency(result.penaltyAmount)}
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
                        + {formatDecimalCurrency(result.interestAmount)}
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
                        + {formatDecimalCurrency(result.correctionAmount)}
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
                  {formatDecimalCurrency(result.updatedAmount)}
               </span>
            </div>
         </CardContent>
      </Card>
   );
}

export function BillInterestCard({ billId }: { billId: string }) {
   return (
      <ErrorBoundary FallbackComponent={InterestCardErrorFallback}>
         <Suspense fallback={<InterestCardSkeleton />}>
            <InterestCardContent billId={billId} />
         </Suspense>
      </ErrorBoundary>
   );
}
