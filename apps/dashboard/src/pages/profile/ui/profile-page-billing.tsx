import { translate } from "@packages/localization";
import { UsageRuler } from "@packages/ui/components/animated-ruler";
import { Button } from "@packages/ui/components/button";
import {
   Card,
   CardAction,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
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
import { AlertCircle, Building, CreditCard, TrendingUp } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

function ProfilePageBillingErrorFallback() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>{translate("pages.profile.billing.title")}</CardTitle>
            <CardDescription>
               {translate("pages.profile.billing.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <AlertCircle className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate("pages.profile.billing.state.error.title")}
                  </EmptyTitle>
                  <EmptyDescription>
                     {translate(
                        "pages.profile.billing.state.error.description",
                     )}
                  </EmptyDescription>
               </EmptyHeader>
               <EmptyContent>
                  <Button
                     onClick={() => window.location.reload()}
                     size="sm"
                     variant="outline"
                  >
                     {translate("common.actions.retry")}
                  </Button>
               </EmptyContent>
            </Empty>
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
   function OrganizationMemberContent() {
      return (
         <ItemGroup>
            <Item>
               <ItemMedia variant="icon">
                  <Building className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     {translate(
                        "pages.profile.billing.state.organization.title",
                     )}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "pages.profile.billing.state.organization.description",
                     )}
                  </ItemDescription>
               </ItemContent>
            </Item>
         </ItemGroup>
      );
   }

   function NoSubscriptionContent() {
      return (
         <ItemGroup>
            <Item>
               <ItemMedia variant="icon">
                  <CreditCard className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     {translate("pages.profile.billing.state.not-active.title")}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "pages.profile.billing.state.not-active.description",
                     )}
                  </ItemDescription>
               </ItemContent>
            </Item>
         </ItemGroup>
      );
   }

   function ActiveSubscriptionContent() {
      return (
         <ItemGroup>
            <Item>
               <ItemMedia variant="icon">
                  <CreditCard className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>{getSubscriptionDisplay()}</ItemTitle>
                  <ItemDescription>
                     {translate("pages.profile.billing.next-billing")}{" "}
                     {getNextBillingDate()}
                  </ItemDescription>
               </ItemContent>
            </Item>
            <ItemSeparator />
            <Item>
               <ItemMedia variant="icon">
                  <TrendingUp className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     {translate("pages.profile.billing.state.active.title")}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "pages.profile.billing.state.active.description",
                     )}
                  </ItemDescription>
               </ItemContent>
               <UsageRuler
                  displayMax={rulerDisplayLimit}
                  legend={translate(
                     "pages.profile.billing.state.active.legend",
                  )}
                  max={meterData.creditedUnits}
                  min={0}
                  value={displayConsumed}
               />
            </Item>
         </ItemGroup>
      );
   }
   return (
      <TooltipProvider>
         <Card>
            <CardHeader>
               <CardTitle>{translate("pages.profile.billing.title")}</CardTitle>
               <CardDescription>
                  {translate("pages.profile.billing.description")}
               </CardDescription>
            </CardHeader>
            <CardContent>
               <OrganizationMemberContent />

               <NoSubscriptionContent />

               <ActiveSubscriptionContent />
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
