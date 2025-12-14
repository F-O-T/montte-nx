import { translate } from "@packages/localization";
import { PlanName, STRIPE_PLANS } from "@packages/stripe/constants";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Item,
   ItemContent,
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowRight, CreditCard, Crown, Zap } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActiveOrganization } from "@/hooks/use-active-organization";

function BillingSectionErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.billing.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.billing.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.profile.billing.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.profile.billing.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function BillingSectionSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/3" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-2/3" />
            </CardDescription>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               <div className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="space-y-2">
                     <Skeleton className="h-5 w-24" />
                     <Skeleton className="h-4 w-32" />
                  </div>
               </div>
               <Skeleton className="h-10 w-full" />
            </div>
         </CardContent>
      </Card>
   );
}

function ActiveSubscriptionContent({ planName }: { planName: string }) {
   const plan = STRIPE_PLANS.find(
      (p) => p.name.toLowerCase() === planName.toLowerCase(),
   );

   if (!plan) {
      return null;
   }

   const PlanIcon = plan.name === PlanName.PRO ? Crown : Zap;

   return (
      <ItemGroup>
         <Item variant="muted">
            <ItemMedia variant="icon">
               <PlanIcon className="size-4" />
            </ItemMedia>
            <ItemContent>
               <ItemTitle>{plan.displayName}</ItemTitle>
               <ItemDescription>{plan.description}</ItemDescription>
            </ItemContent>
         </Item>
         <ItemSeparator />
         <Item variant="muted">
            <ItemMedia variant="icon">
               <CreditCard className="size-4" />
            </ItemMedia>
            <ItemContent>
               <ItemTitle>
                  {translate("dashboard.routes.settings.billing.items.price")}
               </ItemTitle>
               <ItemDescription>
                  {plan.price}
                  {translate("dashboard.routes.settings.billing.items.per-month")}
               </ItemDescription>
            </ItemContent>
         </Item>
      </ItemGroup>
   );
}

function NoSubscriptionContent() {
   const { slug } = useParams({ strict: false }) as { slug: string };

   return (
      <div className="flex flex-col items-center text-center gap-4 py-6">
         <div className="p-3 rounded-full bg-muted">
            <CreditCard className="size-6 text-muted-foreground" />
         </div>
         <div className="space-y-1">
            <h3 className="font-medium">
               {translate(
                  "dashboard.routes.profile.billing.state.not-active.title",
               )}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
               {translate(
                  "dashboard.routes.profile.billing.state.not-active.description",
               )}
            </p>
         </div>
         <Button asChild>
            <Link
               params={{ slug }}
               search={{ success: undefined }}
               to="/$slug/plans"
            >
               {translate("dashboard.routes.settings.billing.upgrade")}
               <ArrowRight className="size-4 ml-2" />
            </Link>
         </Button>
      </div>
   );
}

function BillingSectionContent() {
   const { slug } = useParams({ strict: false }) as { slug: string };
   const navigate = useNavigate();
   const { activeSubscription } = useActiveOrganization();

   const handleNavigateToManagePlan = () => {
      navigate({ params: { slug }, to: "/$slug/manage-plan" });
   };

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.billing.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.billing.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
            {activeSubscription ? (
               <>
                  <ActiveSubscriptionContent
                     planName={activeSubscription.plan}
                  />
                  <Button
                     className="w-full"
                     onClick={handleNavigateToManagePlan}
                     variant="outline"
                  >
                     {translate(
                        "dashboard.routes.settings.billing.manage-plan",
                     )}
                  </Button>
               </>
            ) : (
               <NoSubscriptionContent />
            )}
         </CardContent>
      </Card>
   );
}

export function BillingSection() {
   return (
      <ErrorBoundary FallbackComponent={BillingSectionErrorFallback}>
         <Suspense fallback={<BillingSectionSkeleton />}>
            <BillingSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
