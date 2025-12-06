import { translate } from "@packages/localization";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import { Button } from "@packages/ui/components/button";
import {
   CredenzaBody,
   CredenzaDescription,
   CredenzaFooter,
   CredenzaHeader,
   CredenzaTitle,
} from "@packages/ui/components/credenza";
import {
   SidebarMenu,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Skeleton } from "@packages/ui/components/skeleton";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { LogOutIcon, UserCircleIcon } from "lucide-react";
import { Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useAlertDialog } from "@/hooks/use-alert-dialog";
import { useCredenza } from "@/hooks/use-credenza";
import {
   betterAuthClient,
   type Session,
   useTRPC,
} from "@/integrations/clients";
import { LanguageCommand } from "./language-command";
import { ThemeSwitcher } from "./theme-provider";

function NavUserCredenza({
   session,
   activeOrganization,
   onNavigate,
   onLogout,
}: {
   session: Session;
   activeOrganization: { slug: string };
   onNavigate: () => void;
   onLogout: () => void;
}) {
   return (
      <>
         <CredenzaHeader>
            <CredenzaTitle>
               {translate("dashboard.layout.nav-user.greeting", {
                  name: session.user.name,
               })}
            </CredenzaTitle>
            <CredenzaDescription>{session.user.email}</CredenzaDescription>
         </CredenzaHeader>

         <CredenzaBody className="space-y-4">
            <Button
               asChild
               className="w-full justify-start gap-2"
               onClick={onNavigate}
               variant="outline"
            >
               <Link
                  params={{ slug: activeOrganization.slug }}
                  to="/$slug/profile"
               >
                  <UserCircleIcon />
                  {translate("dashboard.layout.nav-user.main.account")}
               </Link>
            </Button>

            <div className="space-y-3">
               <span className="text-sm font-medium text-muted-foreground">
                  {translate("dashboard.layout.nav-user.preferences.label")}
               </span>
               <div className="flex items-center justify-between">
                  <span className="text-sm">
                     {translate("dashboard.layout.nav-user.preferences.theme")}
                  </span>
                  <ThemeSwitcher />
               </div>
               <div className="flex items-center justify-between gap-8">
                  <span className="text-sm">
                     {translate(
                        "dashboard.layout.nav-user.preferences.language",
                     )}
                  </span>
                  <LanguageCommand />
               </div>
            </div>
         </CredenzaBody>

         <CredenzaFooter>
            <Button
               className="w-full gap-2"
               onClick={onLogout}
               variant="destructive"
            >
               <LogOutIcon />
               {translate("dashboard.layout.nav-user.actions.logout")}
            </Button>
         </CredenzaFooter>
      </>
   );
}

// Simple ErrorBoundary implementation
function NavUserErrorFallback() {
   return (
      <div className="p-4 text-center text-destructive">
         Failed to load user info.
      </div>
   );
}

// Skeleton for loading state
function NavUserSkeleton() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton className="pointer-events-none" size="lg">
               <Skeleton className="h-8 w-8 rounded-lg mr-3" />
               <div className="grid flex-1 text-left text-sm leading-tight">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
               </div>
               <Skeleton className="ml-auto size-4" />
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

// Extracted content with Suspense logic
function NavUserContent() {
   const { activeOrganization } = useActiveOrganization();
   const { setOpenMobile } = useSidebar();
   const router = useRouter();
   const trpc = useTRPC();
   const queryClient = useQueryClient();
   const { openCredenza, closeCredenza } = useCredenza();
   const { openAlertDialog } = useAlertDialog();
   const { data: session } = useSuspenseQuery(
      trpc.session.getSession.queryOptions(),
   );

   const handleLogout = useCallback(async () => {
      await betterAuthClient.signOut({
         fetchOptions: {
            onError: ({ error }) => {
               toast.error(error.message, { id: "logout" });
            },
            onRequest: () => {
               toast.loading(
                  translate("dashboard.layout.nav-user.messages.logging-out"),
                  { id: "logout" },
               );
            },
            onSuccess: async () => {
               await queryClient.invalidateQueries({
                  queryKey: trpc.session.getSession.queryKey(),
               });
               router.navigate({
                  to: "/auth/sign-in",
               });
               toast.success(
                  translate(
                     "dashboard.layout.nav-user.messages.logout-success",
                  ),
                  { id: "logout" },
               );
            },
         },
      });
      setOpenMobile(false);
   }, [queryClient, router.navigate, setOpenMobile, trpc.session.getSession]);

   const handleLogoutClick = useCallback(() => {
      closeCredenza();
      openAlertDialog({
         actionLabel: translate("dashboard.layout.nav-user.actions.logout"),
         cancelLabel: translate("common.actions.cancel"),
         description: translate(
            "dashboard.layout.nav-user.logout-confirmation.description",
         ),
         onAction: handleLogout,
         title: translate(
            "dashboard.layout.nav-user.logout-confirmation.title",
         ),
         variant: "destructive",
      });
   }, [closeCredenza, openAlertDialog, handleLogout]);

   const handleNavigate = useCallback(() => {
      closeCredenza();
      setOpenMobile(false);
   }, [closeCredenza, setOpenMobile]);

   const handleOpenCredenza = useCallback(() => {
      openCredenza({
         children: (
            <NavUserCredenza
               activeOrganization={activeOrganization}
               onLogout={handleLogoutClick}
               onNavigate={handleNavigate}
               session={session}
            />
         ),
      });
   }, [
      openCredenza,
      session,
      activeOrganization,
      handleNavigate,
      handleLogoutClick,
   ]);

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <Avatar
               className="border-border border-2 cursor-pointer"
               onClick={handleOpenCredenza}
            >
               <AvatarImage
                  alt={session?.user.name}
                  src={session?.user.image ?? ""}
               />
               <AvatarFallback className="rounded-lg">
                  {session?.user.name?.charAt(0) || "?"}
               </AvatarFallback>
            </Avatar>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

// Export with Suspense and ErrorBoundary
export function NavUser() {
   return (
      <ErrorBoundary FallbackComponent={NavUserErrorFallback}>
         <Suspense fallback={<NavUserSkeleton />}>
            <NavUserContent />
         </Suspense>
      </ErrorBoundary>
   );
}
