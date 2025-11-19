import { useTRPC } from "@/integrations/clients";
import { Button } from "@packages/ui/components/button";
import {
   Empty,
   EmptyContent,
   EmptyDescription,
   EmptyHeader,
   EmptyMedia,
   EmptyTitle,
} from "@packages/ui/components/empty";
import { Skeleton } from "@packages/ui/components/skeleton";
import {
   Tooltip,
   TooltipContent,
   TooltipTrigger,
} from "@packages/ui/components/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Building, Plus } from "lucide-react";
import { Suspense, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { EditOrganizationSheet } from "../features/edit-organization-sheet";
import { OrganizationInfo } from "./organization-information-section";
import { QuickAccessCards } from "./organization-quick-access-cards";
import { QuickActionsToolbar } from "./organization-quick-actions-toolbar";
import { RecentInvites } from "./organization-recent-invites-section";
import { OrganizationRoles } from "./organization-recent-users-sections";
import { OrganizationStats } from "./organization-stats";

function OrganizationContent() {
   const trpc = useTRPC();
   const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
   const { data: activeOrganization } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );
   const { data: organizations } = useSuspenseQuery(
      trpc.organization.getOrganizations.queryOptions(),
   );
   const { data: organizationLimit } = useSuspenseQuery(
      trpc.organization.getOrganizationLimit.queryOptions(),
   );

   const hasReachedLimit =
      (organizations?.length ?? 0) >= (organizationLimit ?? 3);

   if (!activeOrganization) {
      return (
         <main className="flex flex-col h-full w-full">
            <div className="flex-1 flex items-center justify-center">
               <Empty className="max-w-md">
                  <EmptyHeader>
                     <EmptyMedia variant="icon">
                        <Building className="size-12 text-muted-foreground" />
                     </EmptyMedia>
                     <EmptyTitle>No organization yet</EmptyTitle>
                     <EmptyDescription>
                        Create your first organization to start collaborating
                        with your team and managing your finances together.
                     </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                     <Tooltip>
                        <TooltipTrigger asChild>
                           <Button
                              disabled={hasReachedLimit}
                              size="default"
                              variant="default"
                              onClick={() => setIsCreateSheetOpen(true)}
                           >
                              <Plus className="size-4" />
                              Create Organization
                           </Button>
                        </TooltipTrigger>
                        {hasReachedLimit && (
                           <TooltipContent>
                              <p>Você não pode criar mais organizações</p>
                           </TooltipContent>
                        )}
                     </Tooltip>
                     <EditOrganizationSheet
                       onOpen={isCreateSheetOpen}
                       onOpenChange={setIsCreateSheetOpen}
                     />
                  </EmptyContent>
               </Empty>
            </div>
         </main>
      );
   }

   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2 grid gap-4">
               <QuickActionsToolbar />
               <OrganizationInfo />
               <OrganizationStats />
            </div>
            <QuickAccessCards />
         </div>

         <div className="grid md:grid-cols-2 md:col-span-3 gap-4">
            <OrganizationRoles />
            <RecentInvites />
         </div>
      </main>
   );
}

function OrganizationPageSkeleton() {
   return (
      <main className="flex flex-col h-full w-full gap-4">
         <div className="grid md:grid-cols-3 gap-4">
            <div className="col-span-1 md:col-span-2 grid gap-4">
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-32 w-full" />
               <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
         </div>
         <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
         </div>
      </main>
   );
}

function OrganizationPageError({ error, resetErrorBoundary }: FallbackProps) {
   return (
      <main className="flex flex-col h-full w-full">
         <div className="flex-1 flex items-center justify-center">
            <Empty>
               <EmptyContent>
                  <EmptyMedia variant="icon">
                     <Building className="size-12 text-destructive" />
                  </EmptyMedia>
                  <EmptyTitle>Failed to load organization</EmptyTitle>
                  <EmptyDescription>{error?.message}</EmptyDescription>
                  <div className="mt-6">
                     <Button
                        onClick={resetErrorBoundary}
                        size="default"
                        variant="outline"
                     >
                        Try Again
                     </Button>
                  </div>
               </EmptyContent>
            </Empty>
         </div>
      </main>
   );
}

export function OrganizationPage() {
   return (
      <ErrorBoundary FallbackComponent={OrganizationPageError}>
         <Suspense fallback={<OrganizationPageSkeleton />}>
            <OrganizationContent />
         </Suspense>
      </ErrorBoundary>
   );
}
