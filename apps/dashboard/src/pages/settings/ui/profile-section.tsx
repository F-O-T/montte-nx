import { translate } from "@packages/localization";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
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
import { getInitials } from "@packages/utils/text";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Mail, User } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useTRPC } from "@/integrations/clients";

function ProfileSectionErrorFallback(props: FallbackProps) {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.profile.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.profile.description")}
            </CardDescription>
         </CardHeader>
         <CardContent>
            {createErrorFallback({
               errorDescription: translate(
                  "dashboard.routes.profile.information.state.error.description",
               ),
               errorTitle: translate(
                  "dashboard.routes.profile.information.state.error.title",
               ),
               retryText: translate("common.actions.retry"),
            })(props)}
         </CardContent>
      </Card>
   );
}

function ProfileSectionSkeleton() {
   return (
      <Card>
         <CardHeader>
            <CardTitle>
               <Skeleton className="h-6 w-1/2" />
            </CardTitle>
            <CardDescription>
               <Skeleton className="h-4 w-3/4" />
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
               <Skeleton className="w-20 h-20 rounded-full" />
               <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
               </div>
            </div>
            <div className="space-y-3">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
            </div>
         </CardContent>
      </Card>
   );
}

function ProfileSectionContent() {
   const trpc = useTRPC();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   return (
      <Card>
         <CardHeader>
            <CardTitle>
               {translate("dashboard.routes.settings.profile.title")}
            </CardTitle>
            <CardDescription>
               {translate("dashboard.routes.settings.profile.description")}
            </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
               <Avatar className="w-20 h-20">
                  <AvatarImage
                     alt={session?.user?.name || "Profile picture"}
                     src={session?.user?.image || undefined}
                  />
                  <AvatarFallback className="text-lg">
                     {getInitials(
                        session?.user?.name || "",
                        session?.user?.email || "",
                     )}
                  </AvatarFallback>
               </Avatar>
               <div>
                  <h3 className="font-semibold text-lg">
                     {session?.user?.name || "-"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                     {session?.user?.email || "-"}
                  </p>
               </div>
            </div>

            <ItemGroup>
               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <User className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.profile.items.name",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {session?.user?.name || "-"}
                     </ItemDescription>
                  </ItemContent>
               </Item>

               <ItemSeparator />

               <Item variant="muted">
                  <ItemMedia variant="icon">
                     <Mail className="size-4" />
                  </ItemMedia>
                  <ItemContent>
                     <ItemTitle>
                        {translate(
                           "dashboard.routes.settings.profile.items.email",
                        )}
                     </ItemTitle>
                     <ItemDescription>
                        {session?.user?.email || "-"}
                     </ItemDescription>
                  </ItemContent>
               </Item>
            </ItemGroup>
         </CardContent>
      </Card>
   );
}

export function ProfileSection() {
   return (
      <ErrorBoundary FallbackComponent={ProfileSectionErrorFallback}>
         <Suspense fallback={<ProfileSectionSkeleton />}>
            <ProfileSectionContent />
         </Suspense>
      </ErrorBoundary>
   );
}
