import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
} from "@packages/ui/components/sidebar";
import {
   Bot,
   CreditCard,
   FileText,
   type LayoutDashboardIcon,
   PiggyBank,
   TrendingUp,
   Wallet,
} from "lucide-react";
import type * as React from "react";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { NavMain } from "./nav-main";
import { OrganizationSwitcher } from "./organization-switcher";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   return (
      <Sidebar collapsible="offcanvas" {...props}>
         <SidebarHeader>
            <OrganizationSwitcher />
         </SidebarHeader>
         <SidebarContent>
            <Separator />
            <NavMain />
         </SidebarContent>
      </Sidebar>
   );
}
