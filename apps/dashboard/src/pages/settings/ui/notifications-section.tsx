import { translate } from "@packages/localization";
import {
   Card,
   CardContent,
   CardDescription,
   CardHeader,
   CardTitle,
} from "@packages/ui/components/card";
import {
   Collapsible,
   CollapsibleContent,
} from "@packages/ui/components/collapsible";
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
import { Switch } from "@packages/ui/components/switch";
import {
   AlertTriangle,
   BellOff,
   BellRing,
   CreditCard,
   Loader2,
   Receipt,
   Wallet,
} from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { usePushNotifications } from "@/hooks/use-push-notifications";

function NotificationsSectionSkeleton() {
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
               <Skeleton className="h-14 w-full" />
               <Skeleton className="h-14 w-full" />
               <Skeleton className="h-14 w-full" />
            </div>
         </CardContent>
      </Card>
   );
}

function NotificationsSectionErrorFallback({
   resetErrorBoundary,
}: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.notifications.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.notifications.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <button
               className="text-primary underline"
               onClick={resetErrorBoundary}
            >
               {translate("common.actions.retry")}
            </button>
         </CardContent>
      </Card>
   );
}

function NotificationsSectionContent() {
   const {
      isSupported,
      isEnabled,
      isLoading,
      isPushEnabled,
      permission,
      toggle,
   } = usePushNotifications();

   const {
      preferences,
      isLoading: isLoadingPrefs,
      isUpdating,
      updatePreference,
   } = useNotificationPreferences();

   if (!isSupported) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("dashboard.routes.settings.notifications.title")}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.settings.notifications.not-supported",
                  )}
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   if (!isPushEnabled) {
      return (
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("dashboard.routes.settings.notifications.title")}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.settings.notifications.not-configured",
                  )}
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   if (permission === "denied") {
      return (
         <Card>
            <CardHeader>
               <CardTitle>
                  {translate("dashboard.routes.settings.notifications.title")}
               </CardTitle>
               <CardDescription>
                  {translate(
                     "dashboard.routes.settings.notifications.blocked",
                  )}
               </CardDescription>
            </CardHeader>
         </Card>
      );
   }

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.notifications.title")}
            </CardTitle>
            <CardDescription>
               {translate(
                  "dashboard.routes.settings.notifications.description",
               )}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <Collapsible open={isEnabled}>
               <Item>
                  <ItemMedia variant="icon">
                     {isEnabled ? (
                        <BellRing className="size-4" />
                     ) : (
                        <BellOff className="size-4" />
                     )}
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.notifications.items.enable.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {isEnabled
                           ? translate(
                                "dashboard.routes.settings.notifications.items.enable.enabled",
                             )
                           : translate(
                                "dashboard.routes.settings.notifications.items.enable.disabled",
                             )}
                     </ItemDescription>
                  </ItemContent>
                  {isLoading ? (
                     <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : (
                     <Switch
                        aria-label={translate(
                           "dashboard.routes.settings.notifications.items.enable.title",
                        )}
                        checked={isEnabled}
                        onCheckedChange={toggle}
                     />
                  )}
               </Item>

               <CollapsibleContent>
                  <ItemSeparator className="my-4" />

                  <ItemGroup>
                     <Item>
                        <ItemMedia variant="icon">
                           <Wallet className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>
                              {translate(
                                 "dashboard.routes.settings.notifications.items.budget.title",
                              )}
                           </ItemTitle>
                           <ItemDescription>
                              {translate(
                                 "dashboard.routes.settings.notifications.items.budget.description",
                              )}
                           </ItemDescription>
                        </ItemContent>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label={translate(
                                 "dashboard.routes.settings.notifications.items.budget.title",
                              )}
                              checked={preferences.budgetAlerts}
                              onCheckedChange={(v) =>
                                 updatePreference("budgetAlerts", v)
                              }
                           />
                        )}
                     </Item>

                     <ItemSeparator />

                     <Item>
                        <ItemMedia variant="icon">
                           <Receipt className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>
                              {translate(
                                 "dashboard.routes.settings.notifications.items.bills.title",
                              )}
                           </ItemTitle>
                           <ItemDescription>
                              {translate(
                                 "dashboard.routes.settings.notifications.items.bills.description",
                              )}
                           </ItemDescription>
                        </ItemContent>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label={translate(
                                 "dashboard.routes.settings.notifications.items.bills.title",
                              )}
                              checked={preferences.billReminders}
                              onCheckedChange={(v) =>
                                 updatePreference("billReminders", v)
                              }
                           />
                        )}
                     </Item>

                     <ItemSeparator />

                     <Item>
                        <ItemMedia variant="icon">
                           <AlertTriangle className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>
                              {translate(
                                 "dashboard.routes.settings.notifications.items.overdue.title",
                              )}
                           </ItemTitle>
                           <ItemDescription>
                              {translate(
                                 "dashboard.routes.settings.notifications.items.overdue.description",
                              )}
                           </ItemDescription>
                        </ItemContent>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label={translate(
                                 "dashboard.routes.settings.notifications.items.overdue.title",
                              )}
                              checked={preferences.overdueAlerts}
                              onCheckedChange={(v) =>
                                 updatePreference("overdueAlerts", v)
                              }
                           />
                        )}
                     </Item>

                     <ItemSeparator />

                     <Item>
                        <ItemMedia variant="icon">
                           <CreditCard className="size-4" />
                        </ItemMedia>
                        <ItemContent>
                           <ItemTitle>
                              {translate(
                                 "dashboard.routes.settings.notifications.items.transactions.title",
                              )}
                           </ItemTitle>
                           <ItemDescription>
                              {translate(
                                 "dashboard.routes.settings.notifications.items.transactions.description",
                              )}
                           </ItemDescription>
                        </ItemContent>
                        {isLoadingPrefs || isUpdating ? (
                           <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                           <Switch
                              aria-label={translate(
                                 "dashboard.routes.settings.notifications.items.transactions.title",
                              )}
                              checked={preferences.transactionAlerts}
                              onCheckedChange={(v) =>
                                 updatePreference("transactionAlerts", v)
                              }
                           />
                        )}
                     </Item>
                  </ItemGroup>
               </CollapsibleContent>
            </Collapsible>
         </CardContent>
      </Card>
   );
}

export function NotificationsSection() {
   return (
      <ErrorBoundary FallbackComponent={NotificationsSectionErrorFallback}>
         <Suspense fallback={<NotificationsSectionSkeleton />}>
            <NotificationsSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
