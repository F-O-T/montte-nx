import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { cn } from "@packages/ui/lib/utils";
import type * as React from "react";
import { useEffect } from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useLastOrganization } from "@/hooks/use-last-organization";
import { useIsStandalone } from "@/hooks/use-standalone";
import { AppSidebar } from "./app-sidebar";
import { BottomNavigation } from "./bottom-navigation";
import { SiteHeader } from "./site-header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
   const isMobile = useIsMobile();
   const isStandalone = useIsStandalone();
   const showBottomNav = isMobile && isStandalone;

   const { activeOrganization } = useActiveOrganization();
   const { setLastSlug } = useLastOrganization();

   useEffect(() => {
      if (activeOrganization?.slug) {
         setLastSlug(activeOrganization.slug);
      }
   }, [activeOrganization?.slug, setLastSlug]);

   return (
      <SidebarProvider defaultOpen={false}>
         {!showBottomNav && <AppSidebar variant="inset" />}
         <SidebarInset>
            <SiteHeader />
            <div
               className={cn(
                  "p-4 h-full flex-1 overflow-y-auto",
                  showBottomNav &&
                     "pb-[calc(5rem+env(safe-area-inset-bottom))]",
               )}
            >
               {children}
            </div>
            {showBottomNav && <BottomNavigation />}
         </SidebarInset>
      </SidebarProvider>
   );
}
