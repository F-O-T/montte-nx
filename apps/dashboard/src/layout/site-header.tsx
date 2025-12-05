import { Separator } from "@packages/ui/components/separator";
import { SidebarTrigger } from "@packages/ui/components/sidebar";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { useIsStandalone } from "@/hooks/use-standalone";
import { NavUser } from "./nav-user";
import { NavigationBreadcrumb } from "./navigation-breadcrumb";

export function SiteHeader() {
   const isMobile = useIsMobile();
   const isStandalone = useIsStandalone();
   const showBottomNav = isMobile && isStandalone;

   return (
      <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear ">
         <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            {!showBottomNav && (
               <>
                  <SidebarTrigger className="-ml-1" />
                  <Separator
                     className="mx-2 data-[orientation=vertical]:h-4"
                     orientation="vertical"
                  />
               </>
            )}
            <div className="flex-1">
               <NavigationBreadcrumb />
            </div>
            <div className="ml-auto">
               <NavUser />
            </div>
         </div>
      </header>
   );
}
