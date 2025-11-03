import { translate } from "@packages/localization";
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
   ItemDescription,
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { TooltipProvider } from "@packages/ui/components/tooltip";
import { CreditCard } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

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

function ProfilePageBillingContent() {
   function NoSubscriptionContent() {
      return (
         <ItemGroup>
            <Item>
               <ItemMedia variant="icon">
                  <CreditCard className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     {translate(
                        "dashboard.routes.profile.billing.state.not-active.title",
                     )}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "dashboard.routes.profile.billing.state.not-active.description",
                     )}
                  </ItemDescription>
               </ItemContent>
            </Item>
         </ItemGroup>
      );
   }

   return (
      <TooltipProvider>
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
      </TooltipProvider>
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
