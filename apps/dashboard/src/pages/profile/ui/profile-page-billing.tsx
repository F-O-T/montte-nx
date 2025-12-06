import { translate } from "@packages/localization";
import { PlanName, STRIPE_PLANS } from "@packages/stripe/constants";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import { createErrorFallback } from "@packages/ui/components/error-fallback";
import {
   Item,
   ItemContent,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
} from "@packages/ui/components/item";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowRight, CreditCard, Crown, Zap } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useActivePlan } from "@/hooks/use-active-plan";

function ProfilePageBillingErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.profile.billing.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.billing.description")}
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

function ProfilePageBillingSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/3" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-2/3" />
            </CardDescription>
            <CardAction>
               <Skeleton className="size-8" />
            </CardAction>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               <Item>
                  <ItemMedia variant="icon">
                     <Skeleton className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <Skeleton className="h-5 w-1/2" />
                     <Skeleton className="h-4 w-3/4" />
                  </ItemContent>
               </Item>
               <ItemSeparator />
               <Item>
                  <ItemMedia variant="icon">
                     <Skeleton className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <Skeleton className="h-5 w-1/2" />
                     <Skeleton className="h-4 w-3/4" />
                  </ItemContent>
               </Item>
            </ItemGroup>
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
      <div>
         <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
               <PlanIcon className="size-5" />
            </div>
            <div>
               <h3 className="font-semibold text-lg">{plan.displayName}</h3>
               <p className="text-sm text-muted-foreground">
                  {plan.description}
               </p>
            </div>
         </div>
         <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold">{plan.price}</span>
            <span className="text-muted-foreground">/mês</span>
         </div>
      </div>
   );
}

function NoSubscriptionContent() {
   const { slug } = useParams({ strict: false }) as { slug: string };

   return (
      <div className="flex flex-col items-center text-center gap-4 py-4">
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
               Upgrade Plan
               <ArrowRight className="size-4 ml-2" />
            </Link>
         </Button>
      </div>
   );
}

function ProfilePageBillingContent() {
   const { slug } = useParams({ strict: false }) as { slug: string };
   const navigate = useNavigate();
   const { currentSubscription } = useActivePlan();

   const handleNavigateToManagePlan = () => {
      navigate({ params: { slug }, to: "/$slug/manage-plan" });
   };

   if (currentSubscription) {
      return (
         <QuickAccessCard
            content={
               <ActiveSubscriptionContent planName={currentSubscription.plan} />
            }
            description={translate(
               "dashboard.routes.profile.billing.description",
            )}
            icon={<CreditCard className="size-4" />}
            onClick={handleNavigateToManagePlan}
            title={translate("dashboard.routes.profile.billing.title")}
         />
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.profile.billing.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.profile.billing.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <NoSubscriptionContent />
         </CardContent>
      </Card>
   );
}

export function ProfilePageBilling() {
   return (
      <ErrorBoundary FallbackComponent={ProfilePageBillingErrorFallback}>
         <Suspense fallback={<ProfilePageBillingSkeleton />}>
            <ProfilePageBillingContent />
         </Suspense>
      </ErrorBoundary>
   );
}
