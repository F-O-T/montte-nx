import { translate } from "@packages/localization";
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
   ItemGroup,
   ItemMedia,
   ItemSeparator,
   ItemTitle,
} from "@packages/ui/components/item";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Switch } from "@packages/ui/components/switch";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Activity, Globe, Moon } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { betterAuthClient, useTRPC } from "@/integrations/clients";
import { LanguageCommand } from "@/layout/language-command";
import { ThemeSwitcher } from "@/layout/theme-provider";

function PreferencesSectionSkeleton() {
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

function PreferencesSectionErrorFallback({ resetErrorBoundary }: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.preferences.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.preferences.description")}
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

function PreferencesSectionContent() {
   const trpc = useTRPC();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   const updateConsentMutation = useMutation({
      mutationFn: async (consent: boolean) => {
         return betterAuthClient.updateUser({
            telemetryConsent: consent,
         });
      },
   });

   const hasConsent = session?.user?.telemetryConsent ?? true;

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.preferences.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.preferences.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            <ItemGroup>
               <Item>
                  <ItemMedia variant="icon">
                     <Moon className="size-4" />
                  </ItemMedia>
                  <ItemContent className="truncate">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.profile.preferences.items.theme.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "dashboard.routes.profile.preferences.items.theme.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <ThemeSwitcher />
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item>
                  <ItemMedia variant="icon">
                     <Globe className="size-4" />
                  </ItemMedia>
                  <ItemContent className="truncate">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.profile.preferences.items.language.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "dashboard.routes.profile.preferences.items.language.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <LanguageCommand />
                  </ItemActions>
               </Item>

               <ItemSeparator />

               <Item>
                  <ItemMedia variant="icon">
                     <Activity className="size-4" />
                  </ItemMedia>
                  <ItemContent className="truncate">
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.profile.preferences.items.telemetry.title",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {translate(
                           "dashboard.routes.profile.preferences.items.telemetry.description",
                        )}
                     </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                     <Switch
                        checked={hasConsent}
                        disabled={updateConsentMutation.isPending}
                        onCheckedChange={(checked) => {
                           updateConsentMutation.mutate(checked);
                        }}
                     />
                  </ItemActions>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

export function PreferencesSection() {
   return (
      <ErrorBoundary FallbackComponent={PreferencesSectionErrorFallback}>
         <Suspense fallback={<PreferencesSectionSkeleton />}>
            <PreferencesSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
