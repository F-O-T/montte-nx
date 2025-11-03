import { translate } from "@packages/localization";
import {
   Card,
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
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { AlertCircle, DollarSign } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { CurrencyCommand } from "@/pages/profile/features/currency-command";

function AccountConfigurationErrorFallback() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>{translate("pages.profile.account.title")}</CardTitle>
            <CardDescription>
               {translate("pages.profile.account.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Empty>
               <EmptyHeader>
                  <EmptyMedia variant="icon">
                     <AlertCircle className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>
                     {translate("pages.profile.account.state.error.title")}
                  </EmptyTitle>
                  <EmptyDescription>
                     {translate(
                        "pages.profile.account.state.error.description",
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

function AccountConfigurationSkeleton() {
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
            <Item className="p-0">
               <ItemMedia variant="icon">
                  <Skeleton className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     <Skeleton className="h-5 w-1/2" />
                  </ItemTitle>
                  <ItemDescription>
                     <Skeleton className="h-4 w-3/4" />
                  </ItemDescription>
               </ItemContent>
            </Item>
         </CardContent>
      </Card>
   );
}

function AccountConfigurationContent() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>{translate("pages.profile.account.title")}</CardTitle>
            <CardDescription>
               {translate("pages.profile.account.description")}
            </CardDescription>
         </CardHeader>

         <CardContent>
            <Item>
               <ItemMedia variant="icon">
                  <DollarSign className="size-4" />
               </ItemMedia>
               <ItemContent>
                  <ItemTitle>
                     {translate("pages.profile.account.items.currency.title")}
                  </ItemTitle>
                  <ItemDescription>
                     {translate(
                        "pages.profile.account.items.currency.description",
                     )}
                  </ItemDescription>
               </ItemContent>
               <CurrencyCommand />
            </Item>
         </CardContent>
      </Card>
   );
}

export function AccountConfigurationSection() {
   return (
      <ErrorBoundary FallbackComponent={AccountConfigurationErrorFallback}>
         <Suspense fallback={<AccountConfigurationSkeleton />}>
            <AccountConfigurationContent />
         </Suspense>
      </ErrorBoundary>
   );
}
