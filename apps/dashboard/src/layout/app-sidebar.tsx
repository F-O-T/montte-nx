import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import type { LayoutDashboardIcon } from "lucide-react";
import { CreditCard, Settings, Tag } from "lucide-react";
import type * as React from "react";
import type { Session } from "@/integrations/clients";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

type NavigationItems = {
   url?: keyof FileRoutesByTo;
   title: string;
   icon: typeof LayoutDashboardIcon;
   subItems?: {
      url: keyof FileRoutesByTo;
      title: string;
      icon?: typeof LayoutDashboardIcon;
   }[];
};

export function AppSidebar({
   session,
   ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session | null }) {
   const navMain: NavigationItems[] = [
      {
         icon: CreditCard,
         title: "Transactions",
         url: "/transactions",
      },
      {
         icon: Tag,
         title: "Categories",
         url: "/categories",
      },
   ];
   return (
      <Sidebar collapsible="offcanvas" {...props}>
         <SidebarHeader>
            <SidebarMenu>
               <SidebarMenuItem>
                  <Link className="flex items-center gap-2" to="/home">
                     <figure className="text-primary">
                        <img alt="Project logo" className="w-8 h-8" />
                     </figure>

                     <span className="text-lg font-semibold">
                        Finance tracker
                     </span>
                  </Link>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarHeader>
         <SidebarContent>
            <NavMain items={navMain} />
         </SidebarContent>
         <SidebarFooter>
            <NavUser session={session} />
         </SidebarFooter>
      </Sidebar>
   );
}
