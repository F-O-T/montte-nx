import { useTRPC } from "@/integrations/clients";
import { EditOrganizationSheet } from "@/pages/organization/features/edit-organization-sheet";
import {
   Avatar,
   AvatarFallback,
   AvatarImage,
} from "@packages/ui/components/avatar";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@packages/ui/components/dropdown-menu";
import {
   Item,
   ItemActions,
   ItemContent,
   ItemDescription,
   ItemMedia,
   ItemTitle,
} from "@packages/ui/components/item";
import {
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   useSidebar,
} from "@packages/ui/components/sidebar";
import { Skeleton } from "@packages/ui/components/skeleton";
import { getInitials } from "@packages/utils/text";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Building, ChevronsUpDown, Plus } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

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
            Teams
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

   const { data: activeOrganization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );

   const queryClient = useQueryClient();

   const setActiveOrganization = useMutation(
      trpc.organization.setActiveOrganization.mutationOptions({
         onSuccess: () => {
            queryClient.invalidateQueries({
               queryKey: trpc.organization.getActiveOrganization.queryKey(),
            })
         }}),
   );

   function handleSetActiveOrganization(organizationId: string) {
      setActiveOrganization.mutateAsync({ organizationId });
   }

   return (
      <>
         <DropdownMenuLabel className="text-muted-foreground text-xs">
            Organizations
         </DropdownMenuLabel>

         {organizations?.length === 0 && (
            <DropdownMenuItem disabled>
               <div className="p-2 text-muted-foreground text-sm w-full text-center">
                  No organizations available
               </div>
            </DropdownMenuItem>
         )}

         {organizations?.map((organization) => (
            <DropdownMenuItem
               onClick={() => handleSetActiveOrganization(organization.id)}
               disabled={setActiveOrganization.isPending || organization.id === activeOrganization?.id}
               className="gap-2 p-2"
               key={organization.id}
            >
               <div className="flex-1 text-sm">{organization.name}</div>
            </DropdownMenuItem>
         ))}
      </>
   );
}

function OrganizationSwitcherContent() {
   const { isMobile } = useSidebar();
   const trpc = useTRPC();

   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);

   const { data: activeOrganization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );
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

   const organizationData = useMemo(() => {
      const hasOrg = !!activeOrganization;
      return {
         description: activeOrganization?.description || "Personal Account",
         hasOrganization: hasOrg,
         name: activeOrganization?.name || "Personal",
      };
   }, [activeOrganization]);

   const menuActions = useMemo(
      () => [
         {
            icon: Building,
            key: "view-organization",
            label: "View Organization details",
            to: "/organization",
         },
      ],
      [],
   );

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                     className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground data-[disabled]:cursor-not-allowed"
                     disabled={!organizationData.hasOrganization}
                     size="lg"
                  >
                     <Item className="p-0 w-full">
                        <ItemMedia>
                           <Avatar className=" rounded-lg">
                              <AvatarImage
                                 alt={organizationData.name}
                                 src={logo?.data ?? ""}
                              />
                              <AvatarFallback className="rounded-lg">
                                 {getInitials(organizationData.name)}
                              </AvatarFallback>
                           </Avatar>
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                           <ItemTitle className="truncate w-full">
                              {organizationData.name}
                           </ItemTitle>
                           <ItemDescription className="text-xs truncate">
                              {organizationData.description}
                           </ItemDescription>
                        </ItemContent>
                        {organizationData.hasOrganization && (
                           <ItemActions>
                              <ChevronsUpDown className="size-4" />
                           </ItemActions>
                        )}
                     </Item>
                  </SidebarMenuButton>
               </DropdownMenuTrigger>
               {organizationData.hasOrganization && (
                  <DropdownMenuContent
                     align="start"
                     side={isMobile ? "bottom" : "right"}
                     sideOffset={4}
                  >
                     <DropdownMenuLabel>Current Organization</DropdownMenuLabel>

                     {activeOrganization &&
                        menuActions.map(({ key, to, icon: Icon, label }) => (
                           <DropdownMenuItem asChild key={key}>
                              <Link className="w-full flex gap-2" to={to}>
                                 <Icon className="size-4" />
                                 {label}
                              </Link>
                           </DropdownMenuItem>
                        ))}

                     <DropdownMenuSeparator />

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
                        title={hasReachedLimit ? "Você não pode criar mais organizações" : undefined}
                     >
                        <Plus className="size-4" />
                        Create Organization
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               )}
            </DropdownMenu>
         </SidebarMenuItem>

         <EditOrganizationSheet
            onOpen={isCreateSheetOpen}
            onOpenChange={setIsCreateSheetOpen}
         />
      </SidebarMenu>
   );
}
