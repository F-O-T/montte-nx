import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { FileText, Home } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";
import { BudgetDetailsStats } from "./budget-details-stats";
import { BudgetInformationSection } from "./budget-information-section";
import { BudgetProgressSection } from "./budget-progress-section";

function BudgetContent() {
   const params = useParams({ strict: false });
   const budgetId = (params as { budgetId?: string }).budgetId ?? "";
   const trpc = useTRPC();

   const { data: budget } = useSuspenseQuery(
      trpc.budgets.getById.queryOptions({ id: budgetId }),
   );

   if (!budgetId) {
      return (
         <BudgetPageError
            error={new Error("Invalid budget ID")}
            resetErrorBoundary={() => {}}
         />
      );
   }

   if (!budget) {
      return null;
   }

   return (
      <main className="space-y-4">
         <DefaultHeader
            description="Acompanhe o progresso e detalhes deste orçamento"
            title={budget.name}
         />
         <BudgetProgressSection budget={budget} />
         <BudgetDetailsStats budget={budget} />
         <BudgetInformationSection budget={budget} />
      </main>
   );
}

function BudgetPageSkeleton() {
   return (
      <main className="space-y-4">
         <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-6 w-72" />
         </div>
         <Skeleton className="h-32 w-full" />
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
         </div>
         <Skeleton className="h-64 w-full" />
      </main>
   );
}

function BudgetPageError({ error, resetErrorBoundary }: FallbackProps) {
   const { activeOrganization } = useActiveOrganization();
   const router = useRouter();
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <FileText className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>Erro ao carregar orçamento</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6 flex gap-2 justify-center">
                     <Button
                        onClick={() =>
                           router.navigate({
                              params: { slug: activeOrganization.slug },
                              to: "/$slug/budgets",
                           })
                        }
                        size="default"
                        variant="outline"
                     >
                        <Home className="size-4 mr-2" />
                        Voltar para Orçamentos
                     </Button>
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="default"
                     >
                        {translate("common.actions.retry")}
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function BudgetDetailsPage() {
   return (
      <ErrorBoundary FallbackComponent={BudgetPageError}>
         <Suspense fallback={<BudgetPageSkeleton />}>
            <BudgetContent />
         </Suspense>
      </ErrorBoundary>
   );
}
