import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import {
   useMutation,
   useQueryClient,
   useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { ChevronsUpDown, Plus } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ManageOrganizationSheet } from "@/features/organization-actions/ui/manage-organization-sheet";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useTRPC } from "@/integrations/clients";

function OrganizationSwitcherErrorFallback() {
   return (
      <div className=" text-center text-destructive">
         Failed to load active organization.
      </div>
   );
}

function OrganizationDropdownErrorFallback() {
   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Teams
         </DropdownMenuLabel>
         <DropdownMenuItem disabled>Failed to load teams</DropdownMenuItem>
      </>
   );
}

function OrganizationSwitcherSkeleton() {
   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton size="lg">
               <Skeleton className="size-8 rounded-lg" />
               <div className="grid flex-1 text-left text-sm leading-tight">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
               </div>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

function OrganizationDropdownSkeleton() {
   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Organizations
         </DropdownMenuLabel>
         <DropdownMenuItem disabled>
            <div className="gap-2 p-2 w-full flex items-center">
               <Skeleton className="size-6 rounded" />
               <div className="flex-1">
                  <Skeleton className="h-4 w-24" />
               </div>
            </div>
         </DropdownMenuItem>
      </>
   );
}

export function OrganizationSwitcher() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationSwitcherErrorFallback}>
         <Suspense fallback={<OrganizationSwitcherSkeleton />}>
            <OrganizationSwitcherContent />
         </Suspense>
      </ErrorBoundary>
   );
}

function OrganizationDropdownContent() {
   const trpc = useTRPC();
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();

   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );

   const { data: logo } = useSuspenseQuery(
      trpc.organization.getLogo.queryOptions(),
   );

   const queryClient = useQueryClient();

   const setActiveOrganization = useMutation(
      trpc.organization.setActiveOrganization.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganization.queryKey(),
            });
         },
      }),
   );

   async function handleOrganizationClick(organizationId: string) {
      router.navigate({ params: { slug: organizationId }, to: "/$slug/home" });
   }

   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Organizations
         </DropdownMenuLabel>
         {organizations?.map((organization) => (
            <DropdownMenuItem
               className="gap-2 p-2"
               disabled={
                  setActiveOrganization.isPending ||
                  organization.id === activeOrganization?.id
               }
               key={organization.name}
               onClick={() => handleOrganizationClick(organization.slug)}
            >
               <div className="flex size-6 items-center justify-center rounded-md border">
                  {logo?.data ? (
                     <img
                        alt={organization.name}
                        className="size-3.5 shrink-0 rounded"
                        src={logo.data}
                     />
                  ) : (
                     <div className="size-3.5 shrink-0 flex items-center justify-center text-xs bg-muted rounded">
                        {getInitials(organization.name)}
                     </div>
                  )}
               </div>
               {organization.name}
            </DropdownMenuItem>
         ))}
      </>
   );
}

function OrganizationSwitcherContent() {
   const { isMobile } = useSidebar();
   const trpc = useTRPC();

   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

   const { activeOrganization } = useActiveOrganization();

   const { data: logo } = useSuspenseQuery(
      trpc.organization.getLogo.queryOptions(),
   );

   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );
   const { data: organizationLimit } = useSuspenseQuery(
      trpc.organization.getOrganizationLimit.queryOptions(),
   );

   const hasReachedLimit =
      (organizations?.length ?? 0) >= (organizationLimit ?? 3);

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                     className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                     size="lg"
                  >
                     <div className="rounded-md border text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                        {logo?.data ? (
                           <img
                              alt={activeOrganization.name}
                              className="size-6 rounded"
                              src={logo.data}
                           />
                        ) : (
                           <span className="text-xs font-medium">
                              {getInitials(activeOrganization.name)}
                           </span>
                        )}
                     </div>
                     <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                           {activeOrganization.name}
                        </span>
                        <span className="truncate text-xs">
                           {activeOrganization.description}
                        </span>
                     </div>
                     <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
               </DropdownMenuTrigger>
               <DropdownMenuContent
                  align="start"
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  sideOffset={4}
               >
                  <ErrorBoundary
                     FallbackComponent={OrganizationDropdownErrorFallback}
                  >
                     <Suspense fallback={<OrganizationDropdownSkeleton />}>
                        <OrganizationDropdownContent />
                     </Suspense>
                  </ErrorBoundary>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                     disabled={hasReachedLimit}
                     onClick={() => setIsCreateSheetOpen(true)}
                     title={
                        hasReachedLimit
                           ? "Você não pode criar mais organizações"
                           : undefined
                     }
                  >
                     <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                        <Plus className="size-4" />
                     </div>
                     <div className="text-muted-foreground font-medium">
                        Add organization
                     </div>
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </SidebarMenuItem>

         <ManageOrganizationSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </SidebarMenu>
   );
}
