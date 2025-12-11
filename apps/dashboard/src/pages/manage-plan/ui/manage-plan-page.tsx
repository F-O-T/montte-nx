import { translate } from "@packages/localization";
import { PlanName } from "@packages/stripe/constants";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardFooter,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import {
   ArrowRight,
   Check,
   CreditCard,
   Crown,
   ExternalLink,
   Zap,
} from "lucide-react";
import { Suspense, useTransition } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { toast } from "sonner";
import { DefaultHeader } from "@/default/default-header";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { betterAuthClient, useTRPC } from "@/integrations/clients";

function ManagePlanPageErrorFallback(props: FallbackProps) {
   return createErrorFallback({
      errorDescription: "Falha ao carregar o plano. Tente novamente.",
      errorTitle: "Erro ao carregar plano",
      retryText: translate("common.actions.retry"),
   })(props);
}

function ManagePlanPageSkeleton() {
   return (
      <main className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-48" />
         </div>
         <div className="max-w-2xl mx-auto w-full">
            <Skeleton className="h-[350px]" />
         </div>
      </main>
   );
}

function ManagePlanPageContent() {
   const { slug } = useParams({ strict: false }) as { slug: string };
   const { activeOrganization, activeSubscription } = useActiveOrganization();
   const trpc = useTRPC();
   const [isLoading, startTransition] = useTransition();

   const { data: plans } = useSuspenseQuery(trpc.plans.list.queryOptions());

   if (!activeSubscription) {
      return null;
   }

   const plan = plans.find(
      (p) => p.name.toLowerCase() === activeSubscription.plan.toLowerCase(),
   );

   if (!plan) {
      return null;
   }

   const PlanIcon = plan.name === PlanName.PRO ? Crown : Zap;

   const handleManageSubscription = () => {
      startTransition(async () => {
         if (!activeOrganization?.id) {
            toast.error("Nenhuma organização selecionada");
            return;
         }

         try {
            const { data } = await betterAuthClient.subscription.billingPortal({
               referenceId: activeOrganization.id,
               returnUrl: window.location.href,
            });

            if (data?.url) {
               window.location.href = data.url;
            } else {
               toast.error("Falha ao abrir portal de cobrança", {
                  description: "Tente novamente mais tarde.",
               });
            }
         } catch (error) {
            console.error("Failed to open billing portal:", error);
            toast.error("Falha ao abrir portal de cobrança", {
               description: "Tente novamente mais tarde.",
            });
         }
      });
   };

   return (
      <main className="flex flex-col gap-6">
         <DefaultHeader
            description="Gerencie sua assinatura, atualize seu plano ou altere seus dados de pagamento."
            title="Gerenciar Plano"
         />

         <div className="max-w-2xl mx-auto w-full">
            <Card className="relative border-primary shadow-md ring-2 ring-primary/20">
               <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                     <Check className="size-3" />
                     Plano atual
                  </span>
               </div>

               <CardHeader className="text-center pb-2 pt-8">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary">
                     <PlanIcon className="size-6" />
                  </div>
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                  <CardDescription className="text-sm">
                     {plan.description}
                  </CardDescription>
               </CardHeader>

               <CardContent className="flex-1">
                  <div className="text-center mb-6">
                     <span className="text-4xl font-bold">{plan.price}</span>
                     <span className="text-muted-foreground">/mês</span>
                  </div>

                  <ul className="space-y-3">
                     {plan.features.map((feature) => (
                        <li className="flex items-center gap-2" key={feature}>
                           <Check className="size-4 text-green-500 shrink-0" />
                           <span className="text-sm">{feature}</span>
                        </li>
                     ))}
                  </ul>
               </CardContent>

               <CardFooter className="flex flex-col gap-3">
                  <Button
                     className="w-full"
                     disabled={isLoading}
                     onClick={handleManageSubscription}
                  >
                     {isLoading ? (
                        "Abrindo..."
                     ) : (
                        <>
                           <CreditCard className="size-4 mr-2" />
                           Gerenciar Assinatura
                           <ExternalLink className="size-4 ml-2" />
                        </>
                     )}
                  </Button>

                  <Button asChild className="w-full" variant="outline">
                     <Link
                        params={{ slug }}
                        search={{ success: undefined }}
                        to="/$slug/plans"
                     >
                        Alterar Plano
                        <ArrowRight className="size-4 ml-2" />
                     </Link>
                  </Button>
               </CardFooter>
            </Card>
         </div>
      </main>
   );
}

export function ManagePlanPage() {
   return (
      <ErrorBoundary FallbackComponent={ManagePlanPageErrorFallback}>
         <Suspense fallback={<ManagePlanPageSkeleton />}>
            <ManagePlanPageContent />
         </Suspense>
      </ErrorBoundary>
   );
}
